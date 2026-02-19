import { Component, inject, signal, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoButtonMechanics } from '../no-button-mechanics/no-button-mechanics';
import { CardService } from '../../services/card';
import { ThemeService } from '../../services/theme';
import { RsvpService } from '../../services/rsvp';
import { AuthService } from '../../services/auth';
import { InviteTokenService } from '../../services/invite-token';
import { Card } from '../../models/card.model';
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
  public authService = inject(AuthService);

  card = signal<Card | null>(null);
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

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id');
    const token = this.route.snapshot.paramMap.get('token');
    const mode = this.route.snapshot.queryParamMap.get('mode');
    
    // Check if viewing in view-only mode (from dashboard)
    if (mode === 'view') {
      this.isViewMode.set(true);
    }

    // Se um token foi fornecido, armazená-lo e validar seu status
    if (token) {
      this.inviteToken.set(token);
      // Validar status do token ao carregar
      this.inviteTokenService.checkTokenStatus(token).then(status => {
        if (status.alreadyUsed) {
          this.tokenValid.set(false);
          this.errorMessage.set('Este convite já foi confirmado');
        } else if (status.expired) {
          this.tokenValid.set(false);
          this.errorMessage.set('Este convite expirou');
        }
      }).catch(err => {
        this.tokenValid.set(false);
        this.errorMessage.set('Erro ao validar convite');
      });
    }

    if (cardId) {
      // Live invite view - primeiro tenta da memória
      let card = this.cardService.getCard(cardId);
      if (card) {
        this.card.set(card);
        this.isLiveInvite.set(true);
        this.applyCardStyle(card);
        this.autoPlayAudio();
      } else {
        // Se não encontrar em memória, busca do Supabase
        this.isLoading.set(true);
        this.cardService.getCardFromDb(cardId).then(dbCard => {
          if (dbCard) {
            this.card.set(dbCard);
            this.isLiveInvite.set(true);
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
    
    const cardData = this.card();
    const token = this.inviteToken();

    if (cardData?.id) {
      if (token) {
        this.rsvpService.addResponseViaToken(token, {
          cardId: cardData.id,
          response,
        }).then(() => {
          this.showSuccessMessage();
        }).catch(error => {
          this.errorMessage.set('Erro: ' + (error.message || 'Não foi possível registrar sua resposta'));
          this.tokenValid.set(false);
        });
      } else {
        this.rsvpService.addResponse({
          cardId: cardData.id,
          response,
        }).catch(error => {
          alert('Erro ao registrar sua resposta. Tente novamente.');
        });
      }
    }
  }

  private showSuccessMessage(): void {
    // Desabilitar os botões de resposta após confirmação
    this.tokenValid.set(false);
    this.errorMessage.set('Obrigado! Sua presença foi confirmada!');
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
