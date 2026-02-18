import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoButtonMechanics } from '../no-button-mechanics/no-button-mechanics';
import { CardService } from '../../services/card';
import { ThemeService } from '../../services/theme';
import { RsvpService } from '../../services/rsvp';
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

  card = signal<Card | null>(null);
  isLoading = signal(false);
  isLiveInvite = signal(false);
  linkCopied = signal(false);
  whatsappPhone = signal('');
  showWhatsappInput = signal(false);
  isMuted = signal(false);
  themeFont = signal('Poppins');
  themeBgColor = signal('#FFF0F5');
  themeAccentColor = signal('#FF1493');
  schemePrimary = signal('#FF69B4');
  schemeBackground = signal('#FFF0F5');
  schemeText = signal('#333333');

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id');

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
    const cardData = this.card();
    if (cardData?.id) {
      this.rsvpService.addResponse({
        cardId: cardData.id,
        response,
      }).catch(error => {
        console.error('Erro ao registrar resposta:', error);
        alert('Erro ao registrar sua resposta. Tente novamente.');
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  copyLink(): void {
    const cardData = this.card();
    if (cardData?.id) {
      const link = `${window.location.origin}/invite/${cardData.id}`;
      navigator.clipboard.writeText(link);
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    }
  }

  shareWhatsApp(): void {
    const cardData = this.card();
    if (cardData?.id) {
      const url = this.cardService.getWhatsAppShareUrl(
        cardData.id,
        cardData.senderName
      );
      window.open(url, '_blank');
    }
  }

  shareWhatsAppDirect(): void {
    const cardData = this.card();
    const phone = this.whatsappPhone();
    if (cardData?.id && phone) {
      const url = this.cardService.getWhatsAppDirectUrl(
        phone,
        cardData.id,
        cardData.senderName
      );
      window.open(url, '_blank');
    }
  }

  private applyCardStyle(card: Card): void {
    const theme = THEMES.find(t => t.id === card.theme);
    const scheme = COLOR_SCHEMES.find(s => s.id === card.colorScheme);

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
