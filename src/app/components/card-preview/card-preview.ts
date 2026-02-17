import { Component, inject, signal, OnInit } from '@angular/core';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CardService);
  private themeService = inject(ThemeService);
  private rsvpService = inject(RsvpService);

  card = signal<Card | null>(null);
  isLiveInvite = signal(false);
  linkCopied = signal(false);
  whatsappPhone = signal('');
  showWhatsappInput = signal(false);
  themeFont = signal('Poppins');
  themeBgColor = signal('#FFF0F5');
  themeAccentColor = signal('#FF1493');
  schemePrimary = signal('#FF69B4');
  schemeBackground = signal('#FFF0F5');
  schemeText = signal('#333333');

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id');

    if (cardId) {
      // Live invite view
      const card = this.cardService.getCard(cardId);
      if (card) {
        this.card.set(card);
        this.isLiveInvite.set(true);
        this.applyCardStyle(card);
      }
    } else {
      // Preview mode
      this.cardService.getCurrentCard().subscribe(c => {
        if (c) {
          this.card.set(c);
          this.applyCardStyle(c);
        }
      });
    }
  }

  onResponse(response: 'yes' | 'no'): void {
    const cardData = this.card();
    if (cardData?.id) {
      this.rsvpService.addResponse({
        cardId: cardData.id,
        response,
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
        cardData.recipientName,
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
        cardData.recipientName,
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
