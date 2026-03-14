import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../services/card';
import { ThemeService } from '../../services/theme';
import { Card, CardTheme, ColorScheme, ChallengeGameId } from '../../models/card.model';
import { THEMES, COLOR_SCHEMES, NO_BUTTON_MECHANICS, CHALLENGE_GAME_OPTIONS } from '../../models/constants';
import { ThemeSelector } from '../theme-selector/theme-selector';
import { ColorScheme as ColorSchemeComponent } from '../color-scheme/color-scheme';
import { GuestsManager } from '../guests-manager/guests-manager';

type EditSection = 'text' | 'theme' | 'colors' | 'mechanic' | 'challenges' | 'emoji' | 'guests';

@Component({
  selector: 'app-invite-manager',
  imports: [FormsModule, ThemeSelector, ColorSchemeComponent, GuestsManager],
  templateUrl: './invite-manager.html',
  styleUrl: './invite-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteManager implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private themeService = inject(ThemeService);

  card = signal<Card | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  savedSuccess = signal(false);
  activeSection = signal<EditSection>('text');

  // Campos de edição
  senderName = signal('');
  cardTitle = signal('');
  cardMessage = signal('');
  selectedMechanic = signal<Card['noButtonMechanic']>('teleporting');
  challengeModeEnabled = signal(false);
  selectedChallengeGame = signal<ChallengeGameId | null>(null);
  selectedEmoji = signal('');

  readonly mechanics = NO_BUTTON_MECHANICS;
  readonly challengeOptions = CHALLENGE_GAME_OPTIONS;

  readonly FLOATING_EMOJIS = [
    { emoji: '', label: 'Nenhum' },
    { emoji: '🎉', label: 'Confete' },
    { emoji: '🌸', label: 'Flor' },
    { emoji: '❤️', label: 'Coração' },
    { emoji: '⭐', label: 'Estrela' },
    { emoji: '🦋', label: 'Borboleta' },
  ];

  // Preview ao vivo
  previewCard = computed<Card | null>(() => {
    const base = this.card();
    if (!base) return null;
    return {
      ...base,
      senderName: this.senderName(),
      title: this.cardTitle(),
      message: this.cardMessage(),
      noButtonMechanic: this.selectedMechanic(),
      challengeModeEnabled: this.challengeModeEnabled(),
      challengeGame: this.selectedChallengeGame() ?? undefined,
      floatingEmoji: this.selectedEmoji(),
      theme: this.themeService.selectedTheme()?.id ?? base.theme,
      colorScheme: this.themeService.selectedColorScheme()?.id ?? base.colorScheme,
    };
  });

  previewFont = computed(() => this.themeService.selectedTheme()?.font ?? 'Poppins');
  previewBg = computed(() => this.themeService.selectedTheme()?.backgroundColor ?? '#ffffff');
  previewPrimary = computed(() => this.themeService.selectedColorScheme()?.primary ?? '#1E40AF');
  previewText = computed(() => this.themeService.selectedColorScheme()?.text ?? '#1a1a1a');

  readonly floatingParticles = [
    { id: 0, left: '8%',  delay: '0s',   duration: '7s',   size: '1.4rem' },
    { id: 1, left: '22%', delay: '1.2s', duration: '5.5s', size: '1rem'   },
    { id: 2, left: '38%', delay: '0.5s', duration: '8s',   size: '1.6rem' },
    { id: 3, left: '55%', delay: '2s',   duration: '6.2s', size: '1.2rem' },
    { id: 4, left: '70%', delay: '1s',   duration: '7.5s', size: '0.9rem' },
    { id: 5, left: '84%', delay: '1.8s', duration: '5.2s', size: '1.3rem' },
  ];

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id');
    if (!cardId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Check if should open guests section
    const section = this.route.snapshot.queryParamMap.get('section');
    if (section === 'guests') {
      this.activeSection.set('guests');
    }

    const cached = this.cardService.getCard(cardId);
    if (cached) {
      this.populateForm(cached);
      this.isLoading.set(false);
    } else {
      this.cardService.getCardFromDb(cardId).then(dbCard => {
        if (dbCard) {
          this.populateForm(dbCard);
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.isLoading.set(false);
      }).catch(() => {
        this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      });
    }
  }

  private populateForm(card: Card): void {
    this.card.set(card);
    this.senderName.set(card.senderName);
    this.cardTitle.set(card.title);
    this.cardMessage.set(card.message);
    this.selectedMechanic.set(card.noButtonMechanic);
    this.challengeModeEnabled.set(card.challengeModeEnabled ?? false);
    this.selectedChallengeGame.set(card.challengeGame ?? null);
    this.selectedEmoji.set(card.floatingEmoji ?? '');

    const theme = THEMES.find(t => t.id === card.theme);
    const scheme = COLOR_SCHEMES.find(s => s.id === card.colorScheme);
    if (theme) this.themeService.selectedTheme.set(theme);
    if (scheme) this.themeService.selectedColorScheme.set(scheme);
  }

  onThemeChanged(_theme: CardTheme): void {}
  onSchemeChanged(_scheme: ColorScheme): void {}

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

  toggleSection(section: EditSection): void {
    this.activeSection.set(this.activeSection() === section ? this.activeSection() : section);
  }

  async saveChanges(): Promise<void> {
    const card = this.card();
    if (!card?.id) return;

    if (this.challengeModeEnabled() && !this.selectedChallengeGame()) {
      alert('Selecione 1 jogo para manter o modo desafio ativo.');
      return;
    }

    try {
      this.isSaving.set(true);
      await this.cardService.updateCard(card.id, {
        senderName: this.senderName(),
        title: this.cardTitle(),
        message: this.cardMessage(),
        noButtonMechanic: this.selectedMechanic(),
        challengeModeEnabled: this.challengeModeEnabled(),
        challengeGame: this.selectedChallengeGame() ?? undefined,
        floatingEmoji: this.selectedEmoji(),
        theme: this.themeService.selectedTheme()?.id ?? card.theme,
        colorScheme: this.themeService.selectedColorScheme()?.id ?? card.colorScheme,
      });
      this.savedSuccess.set(true);
      setTimeout(() => this.savedSuccess.set(false), 2500);
    } catch (err) {
      console.error('Erro ao salvar convite:', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  viewLive(): void {
    const card = this.card();
    if (card?.id) {
      this.router.navigate(['/invite', card.id], { queryParams: { mode: 'view' } });
    }
  }
}
