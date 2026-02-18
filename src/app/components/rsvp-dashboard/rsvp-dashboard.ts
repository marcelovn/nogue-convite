import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { CardService } from '../../services/card';
import { RsvpService } from '../../services/rsvp';
import { AuthService } from '../../services/auth';
import { Card, RSVPStats } from '../../models/card.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rsvp-dashboard',
  imports: [DatePipe, CommonModule],
  templateUrl: './rsvp-dashboard.html',
  styleUrl: './rsvp-dashboard.scss',
})
export class RsvpDashboard implements OnInit, OnDestroy {
  private cardService = inject(CardService);
  private rsvpService = inject(RsvpService);
  private router = inject(Router);
  public authService = inject(AuthService);

  cards = signal<Card[]>([]);
  statsMap = signal<Map<string, RSVPStats>>(new Map());
  linkCopied = signal<string | null>(null);
  
  private subscriptions: Subscription[] = [];

  constructor() {
    // React to RSVP changes and recalculate stats
    effect(() => {
      this.rsvpService.rsvpEntries();
      this.updateStatsMap();
    });
  }

  ngOnInit(): void {
    // Subscribe to cards updates
    const cardsSub = this.cardService.cards$.subscribe(cards => {
      this.cards.set(cards);
      this.updateStatsMap();
    });
    this.subscriptions.push(cardsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateStatsMap(): void {
    const cards = this.cards();
    const map = new Map<string, RSVPStats>();
    cards.forEach(card => {
      if (card.id) {
        map.set(card.id, this.rsvpService.getStats(card.id));
      }
    });
    this.statsMap.set(map);
  }

  getStats(cardId: string): RSVPStats {
    return this.statsMap().get(cardId) || { cardId, total: 0, yes: 0, no: 0, percentageYes: 0 };
  }

  getUserName(): string {
    const user = this.authService.currentUser();
    return user?.email?.split('@')[0] || 'Usuário';
  }

  viewCard(cardId: string): void {
    this.router.navigate(['/invite', cardId]);
  }

  deleteCard(cardId: string): void {
    if (confirm('Tem certeza que deseja deletar este cartão?')) {
      this.cardService.deleteCard(cardId).catch(error => {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar cartão');
      });
    }
  }

  copyLink(cardId: string): void {
    const link = `${window.location.origin}/invite/${cardId}`;
    navigator.clipboard.writeText(link);
    this.linkCopied.set(cardId);
    setTimeout(() => this.linkCopied.set(null), 2000);
  }

  shareWhatsApp(card: Card): void {
    if (card.id) {
      const url = this.cardService.getWhatsAppShareUrl(
        card.id,
        card.senderName
      );
      window.open(url, '_blank');
    }
  }

  createNew(): void {
    this.router.navigate(['/editor']);
  }

  getTotalResponses(): number {
    return this.cards().reduce((sum, card) => {
      return sum + this.getStats(card.id!).total;
    }, 0);
  }

  getTotalAcceptanceRate(): number {
    const allStats = this.cards().map(card => this.getStats(card.id!));
    if (allStats.length === 0) return 0;
    
    const totalYes = allStats.reduce((sum, s) => sum + s.yes, 0);
    const totalResponses = allStats.reduce((sum, s) => sum + s.total, 0);
    
    return totalResponses > 0 ? Math.round((totalYes / totalResponses) * 100) : 0;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
