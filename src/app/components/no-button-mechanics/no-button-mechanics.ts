import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-no-button-mechanics',
  imports: [],
  templateUrl: './no-button-mechanics.html',
  styleUrl: './no-button-mechanics.scss',
})
export class NoButtonMechanics {
  mechanic = input<Card['noButtonMechanic']>('teleporting');
  responded = output<'yes' | 'no'>();
  disabled = input(false);

  buttonsContainer = viewChild<ElementRef>('buttonsContainer');

  noClicks = signal(0);
  yesScale = signal(1);
  noScale = signal(1);
  noPosition = signal({ x: 0, y: 0 });
  extraYesButtons = signal<{ x: number; y: number }[]>([]);
  yesText = signal('Sim \u2764');
  hasResponded = signal(false);
  showConfetti = signal(false);

  onYesClick(): void {
    if (this.disabled()) return;
    this.hasResponded.set(true);
    this.showConfetti.set(true);
    this.responded.emit('yes');
  }

  onNoClick(): void {
    if (this.disabled()) return;
    const clicks = this.noClicks() + 1;
    this.noClicks.set(clicks);

    switch (this.mechanic()) {
      case 'teleporting':
        this.teleportNo();
        break;
      case 'growing-yes':
        this.growYes(clicks);
        break;
      case 'multiplying-yes':
        this.multiplyYes();
        break;
      case 'shrinking-no':
        this.shrinkNo(clicks);
        break;
    }
  }

  onNoHover(): void {
    if (this.mechanic() === 'teleporting') {
      this.teleportNo();
    }
  }

  private teleportNo(): void {
    const x = Math.random() * 250 - 125;
    const y = Math.random() * 200 - 100;
    this.noPosition.set({ x, y });
  }

  private growYes(clicks: number): void {
    const newScale = Math.min(1 + clicks * 0.25, 3);
    this.yesScale.set(newScale);
    const texts = ['Sim \u2764', 'Sim!! \u2764', 'SIMM!!! \u2764', 'SIIIM!!!! \u2764\u2764', 'SIIIMM!!!!! \u2764\u2764\u2764'];
    this.yesText.set(texts[Math.min(clicks, texts.length - 1)]);
  }

  private multiplyYes(): void {
    const newButtons: { x: number; y: number }[] = [];
    for (let i = 0; i < 2; i++) {
      newButtons.push({
        x: Math.random() * 300 - 150,
        y: Math.random() * 200 - 100,
      });
    }
    this.extraYesButtons.update(prev => [...prev, ...newButtons]);
  }

  private shrinkNo(clicks: number): void {
    const newScale = Math.max(1 - clicks * 0.2, 0);
    this.noScale.set(newScale);
    if (newScale <= 0) {
      // Button disappeared
    }
  }
}
