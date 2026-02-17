import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CardService } from '../../services/card';
import { RsvpService } from '../../services/rsvp';
import { Card, RSVPStats } from '../../models/card.model';

@Component({
  selector: 'app-rsvp-dashboard',
  imports: [DatePipe],
  templateUrl: './rsvp-dashboard.html',
  styleUrl: './rsvp-dashboard.scss',
})
export class RsvpDashboard implements OnInit {
  private cardService = inject(CardService);
  private rsvpService = inject(RsvpService);
  private router = inject(Router);

  cards = signal<Card[]>([]);
  statsMap = signal<Map<string, RSVPStats>>(new Map());

  ngOnInit(): void {
    const allCards = this.cardService.getAllCards();
    this.cards.set(allCards);

    const map = new Map<string, RSVPStats>();
    allCards.forEach(card => {
      if (card.id) {
        map.set(card.id, this.rsvpService.getStats(card.id));
      }
    });
    this.statsMap.set(map);
  }

  getStats(cardId: string): RSVPStats {
    return this.statsMap().get(cardId) || { cardId, total: 0, yes: 0, no: 0, percentageYes: 0 };
  }

  viewCard(cardId: string): void {
    this.router.navigate(['/invite', cardId]);
  }

  deleteCard(cardId: string): void {
    this.cardService.deleteCard(cardId);
    this.cards.set(this.cardService.getAllCards());
  }

  copyLink(cardId: string): void {
    const link = `${window.location.origin}/invite/${cardId}`;
    navigator.clipboard.writeText(link);
  }

  shareWhatsApp(card: Card): void {
    if (card.id) {
      const url = this.cardService.getWhatsAppShareUrl(
        card.id,
        card.recipientName,
        card.senderName
      );
      window.open(url, '_blank');
    }
  }

  createNew(): void {
    this.router.navigate(['/']);
  }
}
