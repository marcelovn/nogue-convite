import { Component, inject, signal, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoButtonMechanics } from '../no-button-mechanics/no-button-mechanics';
import { CardService } from '../../services/card';
import { ThemeService } from '../../services/theme';
import { RsvpService } from '../../services/rsvp';
import { AuthService } from '../../services/auth';
import { InviteTokenService } from '../../services/invite-token';
import { GuestService } from '../../services/guest.service';
import { Card, ChallengeGameId } from '../../models/card.model';
import { Guest } from '../../models/guest.model';
import { THEMES, COLOR_SCHEMES } from '../../models/constants';

@Component({
  selector: 'app-card-preview',
  imports: [NoButtonMechanics, FormsModule],
  templateUrl: './card-preview.html',
  styleUrl: './card-preview.scss',
})
export class CardPreview implements OnInit {
  @ViewChild('audioPlayer') audioPlayer?: ElementRef<HTMLAudioElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private themeService = inject(ThemeService);
  private rsvpService = inject(RsvpService);
  private inviteTokenService = inject(InviteTokenService);
  private guestService = inject(GuestService);
  public authService = inject(AuthService);

  card = signal<Card | null>(null);
  guest = signal<Guest | null>(null);
  isLoading = signal(false);
  isLiveInvite = signal(false);
  linkCopied = signal(false);
  whatsappPhone = signal('');
  showWhatsappInput = signal(false);
  isMuted = signal(false);
  themeFont = signal('Poppins');
  themeBgColor = signal('#FFF0F5');
  themeAccentColor = signal('#FFB3D9');
  schemePrimary = signal('#FF69B4');
  schemeBackground = signal('#FFF0F5');
  schemeText = signal('#333333');
  inviteToken = signal<string | null>(null);
  tokenValid = signal(true);
  errorMessage = signal('');
  isViewMode = signal(false);
  challengeModeRequired = signal(false);
  challengeUnlocked = signal(true);
  requiredChallengeGame = signal<ChallengeGameId | null>(null);
  challengeCompleted = signal(false);
  activeChallenge = signal<ChallengeGameId | null>(null);
  challengePrompt = signal('');
  challengeDisplay = signal('');
  challengeInput = signal('');
  challengeFeedback = signal('');
  isMemoryHintVisible = signal(false);

  readonly floatingParticles = [
    { id: 0, left: '7%',  delay: '0s',   duration: '7s',   size: '1.8rem' },
    { id: 1, left: '18%', delay: '1.4s', duration: '5.5s', size: '1.3rem' },
    { id: 2, left: '32%', delay: '0.5s', duration: '8s',   size: '2rem'   },
    { id: 3, left: '50%', delay: '2.2s', duration: '6.2s', size: '1.5rem' },
    { id: 4, left: '63%', delay: '1s',   duration: '7.5s', size: '1.2rem' },
    { id: 5, left: '76%', delay: '1.8s', duration: '5.2s', size: '1.7rem' },
    { id: 6, left: '88%', delay: '3.1s', duration: '6.8s', size: '1.4rem' },
    { id: 7, left: '42%', delay: '4.3s', duration: '8.5s', size: '1.1rem' },
  ];

  constructor() {
    // React to theme and color scheme changes during preview mode
    effect(() => {
      const currentCard = this.card();
      const selectedTheme = this.themeService.selectedTheme();
      const selectedScheme = this.themeService.selectedColorScheme();
      
      if (currentCard && !this.isLiveInvite()) {
        this.applyCardStyle(currentCard);
      }
    });
  }

  readonly challengeGameLabels: Record<ChallengeGameId, string> = {
    'quick-math': 'Conta Rápida',
    'emoji-count': 'Contagem de Emoji',
    'word-scramble': 'Palavra Embaralhada',
    'memory-number': 'Memória Numérica',
    'bigger-number': 'Maior Número',
    'true-false': 'Verdadeiro ou Falso',
  };

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id');
    const token = this.route.snapshot.paramMap.get('token');
    const mode = this.route.snapshot.queryParamMap.get('mode');
    
    // Check if viewing in view-only mode (from dashboard)
    if (mode === 'view') {
      this.isViewMode.set(true);
    }

    // Se um token foi fornecido, verificar se é token de convidado ou token de convite
    if (token) {
      this.inviteToken.set(token);
      this.isLoading.set(true);
      
      // Guardar na localStorage para bloquear reenvios mesmo antes de a DB confirmar
      const lsKey = `rsvp_done_${token}`;
      if (!this.isViewMode() && localStorage.getItem(lsKey)) {
        this.tokenValid.set(false);
        this.errorMessage.set('Convite único já utilizado. Este link não pode mais ser usado.');
        // Ainda carregamos o card para exibir o convite (somente leitura)
      }

      // Tentar buscar convidado por token primeiro
      this.guestService.getGuestByToken(token).then(guest => {
        if (guest) {
          // É um token de convidado
          this.guest.set(guest);
          
          // Marcar como visualizado
          if (guest.status === 'pending' || guest.status === 'sent') {
            this.guestService.markAsViewed(guest.id!);
          }
          
          // Verificar se já confirmou (DB ou localStorage)
          if (!this.isViewMode() && (guest.status === 'confirmed' || guest.status === 'declined' || localStorage.getItem(lsKey))) {
            this.tokenValid.set(false);
            this.errorMessage.set('Convite único já utilizado. Este link não pode mais ser usado.');
          }
          
          // Carregar o card
          return this.cardService.getCardFromDb(guest.cardId);
        } else {
          // Tentar como token de convite (sistema antigo)
          return this.inviteTokenService.checkTokenStatus(token).then(status => {
            if (!this.isViewMode()) {
              if (status.alreadyUsed) {
                this.tokenValid.set(false);
                this.errorMessage.set('Convite único já utilizado. Este link não pode mais ser usado.');
              } else if (status.expired) {
                this.tokenValid.set(false);
                this.errorMessage.set('Convite único expirado. Peça um novo link ao anfitrião.');
              } else if (!status.isValid) {
                this.tokenValid.set(false);
                this.errorMessage.set('Token inválido para este convite.');
              }
            }

            // Sempre carregar o card para exibir (somente leitura se bloqueado)
            if (status.cardId) {
              return this.cardService.getCardFromDb(status.cardId);
            }
            return null;
          });
        }
      }).then(dbCard => {
        if (dbCard) {
          this.card.set(dbCard);
          this.isLiveInvite.set(true);
          this.configureChallengeMode(dbCard);
          this.applyCardStyle(dbCard);
          this.autoPlayAudio();
        }
        this.isLoading.set(false);
      }).catch(err => {
        console.error('Erro ao validar token:', err);
        this.tokenValid.set(false);
        this.errorMessage.set('Erro ao validar convite');
        this.isLoading.set(false);
      });
      
      // Se token foi fornecido, não continuar com o resto da lógica
      return;
    }

    if (cardId) {
      // Live invite view - primeiro tenta da memória
      let card = this.cardService.getCard(cardId);
      if (card) {
        this.card.set(card);
        this.isLiveInvite.set(true);
        this.applyNonTokenRestriction();
        this.configureChallengeMode(card);
        this.applyCardStyle(card);
        this.autoPlayAudio();
      } else {
        // Se não encontrar em memória, busca do Supabase
        this.isLoading.set(true);
        this.cardService.getCardFromDb(cardId).then(dbCard => {
          if (dbCard) {
            this.card.set(dbCard);
            this.isLiveInvite.set(true);
            this.applyNonTokenRestriction();
            this.configureChallengeMode(dbCard);
            this.applyCardStyle(dbCard);
            this.autoPlayAudio();
          }
          this.isLoading.set(false);
        }).catch(err => {
          console.error('Erro ao carregar cartão:', err);
          this.isLoading.set(false);
        });
      }
    } else {
      // Preview mode
      this.cardService.getCurrentCard().subscribe(c => {
        if (c) {
          this.card.set(c);
          this.configureChallengeMode(c);
          this.applyCardStyle(c);
          this.autoPlayAudio();
        }
      });
    }
  }

  private autoPlayAudio(): void {
    setTimeout(() => {
      if (this.audioPlayer?.nativeElement) {
        this.audioPlayer.nativeElement.play().catch(() => {
          // Auto-play blocked by browser, user can click play manually
        });
      }
    }, 500);
  }

  toggleMute(): void {
    if (this.audioPlayer?.nativeElement) {
      this.isMuted.update(v => !v);
      this.audioPlayer.nativeElement.muted = this.isMuted();
    }
  }

  onAudioPlay(): void {
    // Audio is playing
  }

  onAudioPause(): void {
    // Audio was paused
  }

  onResponse(response: 'yes' | 'no'): void {
    // Don't record responses in view-only mode
    if (this.isViewMode()) {
      return;
    }

    if (this.isChallengeLocked()) {
      this.challengeFeedback.set('Complete o desafio para liberar sua resposta.');
      return;
    }

    if (this.requiresIndividualToken()) {
      this.tokenValid.set(false);
      this.errorMessage.set('Este link não é individual. Use o link único enviado ao convidado para confirmar presença.');
      return;
    }

    // Chave de localStorage para bloquear reenvios
    const lsKey = this.getResponseLsKey();
    if (lsKey && localStorage.getItem(lsKey)) {
      this.tokenValid.set(false);
      this.errorMessage.set('Você já respondeu a este convite.');
      return;
    }
    
    const cardData = this.card();
    const token = this.inviteToken();
    const currentGuest = this.guest();

    if (cardData?.id) {
      // Bloquear imediatamente (otimista) antes do async
      if (lsKey) {
        localStorage.setItem(lsKey, '1');
      }

      // Se é um convidado individual, registrar via GuestService
      if (currentGuest?.id && currentGuest?.token) {
        this.guestService.recordResponse(currentGuest.id, response, currentGuest.token).then(() => {
          this.showSuccessMessage();
        }).catch(error => {
          this.errorMessage.set('Erro: ' + (error.message || 'Não foi possível registrar sua resposta'));
          this.tokenValid.set(false);
        });
      }
      // Token de convite antigo (sem convidado)
      else if (token) {
        this.rsvpService.addResponseViaToken(token, {
          cardId: cardData.id,
          response,
        }).then(() => {
          this.showSuccessMessage();
        }).catch(error => {
          this.errorMessage.set('Erro: ' + (error.message || 'Não foi possível registrar sua resposta'));
          this.tokenValid.set(false);
        });
      }
      // Sem token (acesso direto por cardId)
      else {
        this.rsvpService.addResponse({
          cardId: cardData.id,
          response,
        }).then(() => {
          this.showSuccessMessage();
        }).catch(error => {
          // Se falhou e não é duplicata, remover o bloqueio
          if (lsKey) localStorage.removeItem(lsKey);
          alert('Erro ao registrar sua resposta. Tente novamente.');
        });
      }
    }
  }

  isChallengeLocked(): boolean {
    return this.challengeModeRequired() && !this.challengeUnlocked();
  }

  requiresIndividualToken(): boolean {
    return this.isLiveInvite() && !this.isViewMode() && !this.inviteToken() && !this.authService.isAuthenticated();
  }

  isChallengeCompleted(gameId: ChallengeGameId): boolean {
    return this.challengeCompleted() && this.requiredChallengeGame() === gameId;
  }

  startChallenge(gameId: ChallengeGameId): void {
    if (this.isChallengeCompleted(gameId)) {
      return;
    }

    this.activeChallenge.set(gameId);
    this.challengeInput.set('');
    this.challengeFeedback.set('');
    this.challengeDisplay.set('');
    this.isMemoryHintVisible.set(false);

    switch (gameId) {
      case 'quick-math': {
        const first = this.randomInt(8, 25);
        const second = this.randomInt(3, 18);
        this.challengePrompt.set(`Quanto é ${first} + ${second}?`);
        this.activeExpectedAnswer = String(first + second);
        return;
      }
      case 'emoji-count': {
        const count = this.randomInt(4, 9);
        this.challengePrompt.set('Digite a quantidade correta de balões.');
        this.challengeDisplay.set('🎈 '.repeat(count).trim());
        this.activeExpectedAnswer = String(count);
        return;
      }
      case 'word-scramble': {
        const words = ['AMOR', 'FESTA', 'CONVITE', 'ALEGRIA', 'CARINHO'];
        const selectedWord = words[this.randomInt(0, words.length - 1)];
        const shuffled = selectedWord.split('').sort(() => Math.random() - 0.5).join('');
        this.challengePrompt.set('Descubra a palavra embaralhada.');
        this.challengeDisplay.set(shuffled);
        this.activeExpectedAnswer = selectedWord;
        return;
      }
      case 'memory-number': {
        const number = String(this.randomInt(1000, 9999));
        this.challengePrompt.set('Memorize o número por 2 segundos e digite depois.');
        this.challengeDisplay.set(number);
        this.activeExpectedAnswer = number;
        this.isMemoryHintVisible.set(true);
        setTimeout(() => {
          if (this.activeChallenge() === 'memory-number') {
            this.isMemoryHintVisible.set(false);
          }
        }, 2000);
        return;
      }
      case 'bigger-number': {
        const first = this.randomInt(10, 99);
        const second = this.randomInt(10, 99);
        this.challengePrompt.set(`Qual número é maior: ${first} ou ${second}?`);
        this.challengeDisplay.set(`${first} | ${second}`);
        this.activeExpectedAnswer = String(Math.max(first, second));
        return;
      }
      case 'true-false': {
        const first = this.randomInt(2, 9);
        const second = this.randomInt(2, 9);
        const shownResult = this.randomInt(0, 1) === 1 ? first * second : first * second + this.randomInt(1, 3);
        const isTrue = shownResult === first * second;
        this.challengePrompt.set(`A afirmação é verdadeira? ${first} x ${second} = ${shownResult}`);
        this.challengeDisplay.set('Responda com verdadeiro ou falso');
        this.activeExpectedAnswer = isTrue ? 'verdadeiro' : 'falso';
        return;
      }
    }
  }

  submitChallengeAnswer(rawAnswer: string): void {
    const challenge = this.activeChallenge();
    if (!challenge) {
      return;
    }

    const normalizedAnswer = rawAnswer.trim().toLowerCase();
    const expected = this.activeExpectedAnswer.trim().toLowerCase();

    if (!normalizedAnswer) {
      this.challengeFeedback.set('Digite uma resposta para validar o desafio.');
      return;
    }

    if (normalizedAnswer === expected) {
      this.challengeCompleted.set(true);
      this.challengeFeedback.set('✅ Desafio concluído!');
      this.activeChallenge.set(null);
      this.challengeInput.set('');
      this.challengePrompt.set('');
      this.challengeDisplay.set('');
      this.isMemoryHintVisible.set(false);
      this.challengeUnlocked.set(true);
      return;
    }

    this.challengeFeedback.set('Resposta incorreta. Tente novamente!');
  }

  answerBiggerNumber(value: string): void {
    this.submitChallengeAnswer(value);
  }

  answerTrueFalse(isTrue: boolean): void {
    this.submitChallengeAnswer(isTrue ? 'verdadeiro' : 'falso');
  }

  getChallengeLabel(gameId: ChallengeGameId): string {
    return this.challengeGameLabels[gameId] ?? gameId;
  }

  private showSuccessMessage(): void {
    // Desabilitar os botões de resposta após confirmação
    this.tokenValid.set(false);
    this.errorMessage.set('Obrigado! Sua presença foi confirmada!');
  }

  private activeExpectedAnswer = '';

  private configureChallengeMode(card: Card): void {
    const configuredGame = this.sanitizeChallengeGame(card.challengeGame);
    const shouldRequireChallenges =
      !!card.challengeModeEnabled &&
      !!configuredGame &&
      this.isLiveInvite() &&
      !this.isViewMode();

    this.requiredChallengeGame.set(configuredGame);
    this.challengeCompleted.set(false);
    this.challengeModeRequired.set(shouldRequireChallenges);
    this.challengeUnlocked.set(!shouldRequireChallenges);
    this.activeChallenge.set(null);
    this.challengeFeedback.set('');
    this.challengePrompt.set('');
    this.challengeDisplay.set('');
    this.challengeInput.set('');
    this.isMemoryHintVisible.set(false);
    this.activeExpectedAnswer = '';
  }

  private sanitizeChallengeGame(gameId: ChallengeGameId | undefined): ChallengeGameId | null {
    const validIds = new Set<ChallengeGameId>([
      'quick-math',
      'emoji-count',
      'word-scramble',
      'memory-number',
      'bigger-number',
      'true-false',
    ]);

    if (!gameId) {
      return null;
    }

    return validIds.has(gameId) ? gameId : null;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private applyNonTokenRestriction(): void {
    // Verificar localStorage para bloquear re-submissão após refresh
    const cardId = this.card()?.id ?? this.route.snapshot.paramMap.get('id');
    if (cardId && localStorage.getItem(`rsvp_done_card_${cardId}`)) {
      this.tokenValid.set(false);
      this.errorMessage.set('Você já respondeu a este convite.');
      return;
    }

    if (this.requiresIndividualToken()) {
      this.tokenValid.set(false);
      this.errorMessage.set('Este convite exige link único individual. Peça ao anfitrião o link correto de confirmação.');
    }
  }

  /**
   * Retorna a chave de localStorage para bloquear reenvio.
   * Token path: rsvp_done_<token> (por token, cada link tem chave única)
   * CardId path: rsvp_done_card_<cardId> (por card)
   */
  private getResponseLsKey(): string | null {
    const token = this.inviteToken();
    if (token) return `rsvp_done_${token}`;
    const cardId = this.card()?.id ?? this.route.snapshot.paramMap.get('id');
    if (cardId) return `rsvp_done_card_${cardId}`;
    return null;
  }

  goBack(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.isLiveInvite() ? '/dashboard' : '/editor']);
      return;
    }

    this.router.navigate(['/']);
  }

  copyLink(): void {
    const cardData = this.card();
    if (cardData?.id) {
      this.inviteTokenService.generateToken(cardData.id).then(token => {
        const link = `${window.location.origin}/invite/${cardData.id}/${token}`;
        navigator.clipboard.writeText(link);
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 2000);
      }).catch(() => {
        const link = `${window.location.origin}/invite/${cardData.id}`;
        navigator.clipboard.writeText(link);
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 2000);
      });
    }
  }

  shareWhatsApp(): void {
    const cardData = this.card();
    if (cardData && cardData.id) {
      const cardId = cardData.id;
      // Gerar novo token e compartilhar com link seguro
      this.inviteTokenService.generateToken(cardId).then(token => {
        const link = `${window.location.origin}/invite/${cardId}/${token}`;
        const message = `🎉 Olá! Você recebeu um convite especial de ${cardData.senderName || 'alguém'}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }).catch(error => {
        console.error('Erro ao gerar token:', error);
        // Fallback: compartilhar sem token
        const url = this.cardService.getWhatsAppShareUrl(
          cardId,
          cardData.senderName
        );
        window.open(url, '_blank');
      });
    }
  }

  shareWhatsAppDirect(): void {
    const cardData = this.card();
    const phone = this.whatsappPhone();
    if (cardData && cardData.id && phone) {
      const cardId = cardData.id;
      // Gerar novo token e compartilhar com link seguro
      this.inviteTokenService.generateToken(cardId).then(token => {
        const link = `${window.location.origin}/invite/${cardId}/${token}`;
        const message = `🎉 Olá! Você recebeu um convite especial de ${cardData.senderName || 'alguém'}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
        const cleanPhone = phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }).catch(error => {
        console.error('Erro ao gerar token:', error);
        // Fallback: compartilhar sem token
        const url = this.cardService.getWhatsAppDirectUrl(
          phone,
          cardId,
          cardData.senderName
        );
        window.open(url, '_blank');
      });
    }
  }

  private applyCardStyle(card: Card): void {
    let theme;
    let scheme;

    // In live invite mode, use theme/scheme from the card
    // In preview mode, use selected theme/scheme from service for real-time updates
    if (this.isLiveInvite()) {
      theme = THEMES.find(t => t.id === card.theme);
      scheme = COLOR_SCHEMES.find(s => s.id === card.colorScheme);
    } else {
      // Preview mode - use currently selected theme/scheme
      theme = this.themeService.selectedTheme();
      scheme = this.themeService.selectedColorScheme();
    }

    if (theme) {
      this.themeFont.set(theme.font);
      this.themeBgColor.set(theme.backgroundColor);
      this.themeAccentColor.set(theme.accentColor);
    }
    if (scheme) {
      this.schemePrimary.set(scheme.primary);
      this.schemeBackground.set(scheme.background);
      this.schemeText.set(scheme.text);
    }
  }
}
