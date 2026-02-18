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

  senderName = signal('');
  cardTitle = signal('Você está convidado! 🎉');
  cardMessage = signal('Venha celebrar esse momento especial conosco!');
  selectedMechanic = signal<Card['noButtonMechanic']>('teleporting');
  photoFile = signal<File | null>(null);
  musicFile = signal<File | null>(null);
  photoPreview = signal<string | null>(null);
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

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.photoFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onMusicSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      this.musicFile.set(file);
    }
  }

  clearPhoto(): void {
    this.photoFile.set(null);
    this.photoPreview.set(null);
  }

  clearMusic(): void {
    this.musicFile.set(null);
  }

  previewCard(): void {
    const card = this.buildCard();
    this.cardService.setCurrentCard(card);
    this.router.navigate(['/preview']);
  }

  async saveAndShare(): Promise<void> {
    try {
      const card = this.buildCard();
      
      // Upload files if present (graceful failure)
      if (this.photoFile()) {
        try {
          console.log('Enviando foto...');
          card.photoUrl = await this.cardService.uploadFile(
            this.photoFile()!,
            'photos'
          );
          console.log('Foto enviada com sucesso:', card.photoUrl);
        } catch (err) {
          console.warn('Erro ao fazer upload da foto:', err);
          alert('Não foi possível enviar a foto, mas o convite será criado sem ela.');
        }
      }
      if (this.musicFile()) {
        try {
          console.log('Enviando música...');
          card.musicUrl = await this.cardService.uploadFile(
            this.musicFile()!,
            'music'
          );
          console.log('Música enviada com sucesso:', card.musicUrl);
        } catch (err) {
          console.warn('Erro ao fazer upload da música:', err);
          alert('Não foi possível enviar a música, mas o convite será criado sem ela.');
        }
      }
      
      const id = await this.cardService.createCard(card);
      this.router.navigate(['/invite', id]);
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      alert('Erro ao salvar cartão. Tente novamente.');
    }
  }

  async saveAndShareWhatsApp(): Promise<void> {
    try {
      const card = this.buildCard();
      
      // Upload files if present (graceful failure)
      if (this.photoFile()) {
        try {
          console.log('Enviando foto...');
          card.photoUrl = await this.cardService.uploadFile(
            this.photoFile()!,
            'photos'
          );
          console.log('Foto enviada com sucesso:', card.photoUrl);
        } catch (err) {
          console.warn('Erro ao fazer upload da foto:', err);
          alert('Não foi possível enviar a foto, mas o convite será criado sem ela.');
        }
      }
      if (this.musicFile()) {
        try {
          console.log('Enviando música...');
          card.musicUrl = await this.cardService.uploadFile(
            this.musicFile()!,
            'music'
          );
          console.log('Música enviada com sucesso:', card.musicUrl);
        } catch (err) {
          console.warn('Erro ao fazer upload da música:', err);
          alert('Não foi possível enviar a música, mas o convite será criado sem ela.');
        }
      }
      
      const id = await this.cardService.createCard(card);
      const url = this.cardService.getWhatsAppShareUrl(id, card.senderName);
      window.open(url, '_blank');
      this.router.navigate(['/invite', id]);
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      alert('Erro ao salvar cartão. Tente novamente.');
    }
  }

  private buildCard(): Card {
    return {
      senderName: this.senderName(),
      title: this.cardTitle(),
      message: this.cardMessage(),
      theme: this.themeService.selectedTheme().id,
      colorScheme: this.themeService.selectedColorScheme().id,
      noButtonMechanic: this.selectedMechanic(),
    };
  }
}
