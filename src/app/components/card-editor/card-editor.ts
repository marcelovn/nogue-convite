import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeSelector } from '../theme-selector/theme-selector';
import { ColorScheme } from '../color-scheme/color-scheme';
import { CardService } from '../../services/card';
import { ThemeService } from '../../services/theme';
import { EventService } from '../../services/event.service';
import { Card, CardTheme, ColorScheme as ColorSchemeModel, ChallengeGameId } from '../../models/card.model';
import { CHALLENGE_GAME_OPTIONS, NO_BUTTON_MECHANICS } from '../../models/constants';

@Component({
  selector: 'app-card-editor',
  imports: [FormsModule, ThemeSelector, ColorScheme],
  templateUrl: './card-editor.html',
  styleUrl: './card-editor.scss',
})
export class CardEditor implements OnInit {
  private cardService = inject(CardService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  private eventId = signal<string | null>(null);

  senderName = signal('');
  cardTitle = signal('Você está convidado!');
  cardMessage = signal('Venha celebrar esse momento especial conosco!');
  selectedMechanic = signal<Card['noButtonMechanic']>('teleporting');
  challengeModeEnabled = signal(false);
  selectedChallengeGame = signal<ChallengeGameId | null>(null);
  selectedEmoji = signal('');
  isLoading = signal(false);
  mechanics = NO_BUTTON_MECHANICS;
  challengeOptions = CHALLENGE_GAME_OPTIONS;
  currentStep = signal(1);
  photoUrl = signal<string | null>(null);
  photoPreview = signal<string | null>(null);
  isUploadingPhoto = signal(false);

  readonly FLOATING_EMOJIS = [
    { emoji: '', label: 'Nenhum' },
    { emoji: '🎉', label: 'Confete' },
    { emoji: '🌸', label: 'Flor' },
    { emoji: '❤️', label: 'Coração' },
    { emoji: '⭐', label: 'Estrela' },
    { emoji: '🦋', label: 'Borboleta' },
  ];

  get selectedTheme() { return this.themeService.selectedTheme; }
  get selectedColorScheme() { return this.themeService.selectedColorScheme; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('eventId');
    this.eventId.set(id);
  }

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
    // Update preview immediately when theme changes
    this.updatePreviewCard();
  }

  onSchemeChanged(scheme: ColorSchemeModel): void {
    // Update preview immediately when color scheme changes
    this.updatePreviewCard();
  }

  private updatePreviewCard(): void {
    const card = this.buildCard();
    this.cardService.setCurrentCard(card);
  }

  previewCard(): void {
    const card = this.buildCard();
    this.cardService.setCurrentCard(card);
    this.router.navigate(['/preview']);
  }

  async saveAndShare(): Promise<void> {
    if (this.challengeModeEnabled() && !this.selectedChallengeGame()) {
      alert('Selecione 1 jogo para ativar o modo desafio.');
      return;
    }

    try {
      this.isLoading.set(true);
      const card = this.buildCard();
      const startTime = Date.now();
      
      const id = await this.cardService.createCard(card);
      console.log('Convite criado com ID:', id);

      if (this.eventId()) {
        this.eventService.attachCardToEvent(this.eventId()!, { ...card, id });
      }

      // Garantir que o loading fica visível por pelo menos 1 segundo
      const elapsed = Date.now() - startTime;
      const minLoadingTime = 1000;
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
      }

      if (this.eventId()) {
        await this.router.navigate(['/events', this.eventId()]);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      alert('Erro ao salvar cartão. Tente novamente.');
      this.isLoading.set(false);
    }
  }

  async saveAndShareWhatsApp(): Promise<void> {
    if (this.challengeModeEnabled() && !this.selectedChallengeGame()) {
      alert('Selecione 1 jogo para ativar o modo desafio.');
      return;
    }

    try {
      this.isLoading.set(true);
      const card = this.buildCard();
      const startTime = Date.now();
      
      const id = await this.cardService.createCard(card);
      const url = this.cardService.getWhatsAppShareUrl(id, card.senderName);
      window.open(url, '_blank');

      if (this.eventId()) {
        this.eventService.attachCardToEvent(this.eventId()!, { ...card, id });
      }

      // Garantir que o loading fica visível por pelo menos 1 segundo
      const elapsed = Date.now() - startTime;
      const minLoadingTime = 1000;
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
      }

      if (this.eventId()) {
        await this.router.navigate(['/events', this.eventId()]);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      alert('Erro ao salvar cartão. Tente novamente.');
      this.isLoading.set(false);
    }
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      this.isUploadingPhoto.set(true);
      const url = await this.cardService.uploadFile(file, 'photos');
      this.photoUrl.set(url);
    } catch {
      alert('Erro ao fazer upload da foto. Tente novamente.');
      this.photoPreview.set(null);
    } finally {
      this.isUploadingPhoto.set(false);
    }
  }

  removePhoto(): void {
    this.photoUrl.set(null);
    this.photoPreview.set(null);
  }

  toggleChallengeMode(): void {
    this.challengeModeEnabled.update(value => !value);

    if (!this.challengeModeEnabled()) {
      this.selectedChallengeGame.set(null);
    }
  }

  toggleChallengeGame(gameId: ChallengeGameId): void {
    if (this.selectedChallengeGame() === gameId) {
      this.selectedChallengeGame.set(null);
      return;
    }

    this.selectedChallengeGame.set(gameId);
  }

  private buildCard(): Card {
    return {
      senderName: this.senderName(),
      title: this.cardTitle(),
      message: this.cardMessage(),
      theme: this.themeService.selectedTheme().id,
      colorScheme: this.themeService.selectedColorScheme().id,
      noButtonMechanic: this.selectedMechanic(),
      challengeModeEnabled: this.challengeModeEnabled(),
      challengeGame: this.selectedChallengeGame() ?? undefined,
      floatingEmoji: this.selectedEmoji(),
      photoUrl: this.photoUrl() ?? undefined,
      eventId: this.eventId() ?? undefined,
    };
  }
}
