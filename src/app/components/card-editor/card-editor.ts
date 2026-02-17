import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeSelector } from '../theme-selector/theme-selector';
import { ColorScheme } from '../color-scheme/color-scheme';
import { CardService } from '../../services/card';
import { ThemeService } from '../../services/theme';
import { Card, CardTheme, ColorScheme as ColorSchemeModel } from '../../models/card.model';
import { NO_BUTTON_MECHANICS } from '../../models/constants';

@Component({
  selector: 'app-card-editor',
  imports: [FormsModule, ThemeSelector, ColorScheme],
  templateUrl: './card-editor.html',
  styleUrl: './card-editor.scss',
})
export class CardEditor {
  private cardService = inject(CardService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  recipientName = signal('');
  senderName = signal('');
  cardTitle = signal('Você está convidado! 🎉');
  cardMessage = signal('Venha celebrar esse momento especial conosco!');
  selectedMechanic = signal<Card['noButtonMechanic']>('teleporting');
  mechanics = NO_BUTTON_MECHANICS;
  currentStep = signal(1);

  get selectedTheme() { return this.themeService.selectedTheme; }
  get selectedColorScheme() { return this.themeService.selectedColorScheme; }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  onThemeChanged(theme: CardTheme): void {
    // theme already set via service
  }

  onSchemeChanged(scheme: ColorSchemeModel): void {
    // scheme already set via service
  }

  previewCard(): void {
    const card = this.buildCard();
    this.cardService.setCurrentCard(card);
    this.router.navigate(['/preview']);
  }

  saveAndShare(): void {
    const card = this.buildCard();
    const id = this.cardService.createCard(card);
    this.router.navigate(['/invite', id]);
  }

  saveAndShareWhatsApp(): void {
    const card = this.buildCard();
    const id = this.cardService.createCard(card);
    const url = this.cardService.getWhatsAppShareUrl(
      id,
      card.recipientName,
      card.senderName
    );
    window.open(url, '_blank');
    this.router.navigate(['/invite', id]);
  }

  private buildCard(): Card {
    return {
      recipientName: this.recipientName(),
      senderName: this.senderName(),
      title: this.cardTitle(),
      message: this.cardMessage(),
      theme: this.themeService.selectedTheme().id,
      colorScheme: this.themeService.selectedColorScheme().id,
      noButtonMechanic: this.selectedMechanic(),
    };
  }
}
