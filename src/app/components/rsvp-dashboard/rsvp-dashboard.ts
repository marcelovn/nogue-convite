import { Component, inject, signal, computed, OnInit, OnDestroy, effect, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { CardService } from '../../services/card';
import { RsvpService } from '../../services/rsvp';
import { AuthService } from '../../services/auth';
import { InviteTokenService } from '../../services/invite-token';
import { GuestService } from '../../services/guest.service';
import { EventService } from '../../services/event.service';
import { EventCategoryService } from '../../services/event-category.service';
import { Card, RSVPStats } from '../../models/card.model';
import { COLOR_SCHEMES } from '../../models/constants';
import { AppEvent, EventStatus, computeEventStatus } from '../../models/event.model';
import { Guest } from '../../models/guest.model';
import { Subscription } from 'rxjs';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-rsvp-dashboard',
  imports: [DatePipe, CommonModule, ConfirmDialog],
  templateUrl: './rsvp-dashboard.html',
  styleUrl: './rsvp-dashboard.scss',
})
export class RsvpDashboard implements OnInit, OnDestroy {
  private cardService = inject(CardService);
  private rsvpService = inject(RsvpService);
  private router = inject(Router);
  private inviteTokenService = inject(InviteTokenService);
  private guestService = inject(GuestService);
  private eventService = inject(EventService);
  private categoryService = inject(EventCategoryService);
  public authService = inject(AuthService);

  activeTab = signal<'events' | 'cards'>('events');
  events = this.eventService.events;
  eventsLoaded = this.eventService.hasLoaded;

  cards = signal<Card[]>([]);
  standaloneCards = computed(() => this.cards().filter(c => !c.eventId));
  statsMap = signal<Map<string, RSVPStats>>(new Map());
  linkCopied = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);
  confirmClearId = signal<string | null>(null);
  isLoading = computed(() => !this.cardService.hasLoaded());
  openMenuId = signal<string | null>(null);
  guestPopoverbCardId = signal<string | null>(null);
  guestPopoverList = signal<Guest[]>([]);
  guestPopoverLoading = signal(false);
  private guestCache = new Map<string, Guest[]>();

  private subscriptions: Subscription[] = [];

  constructor() {
    // React to RSVP changes and recalculate stats
    effect(() => {
      this.rsvpService.rsvpEntries();
      this.updateStatsMap();
    });
  }

  ngOnInit(): void {
    const cardsSub = this.cardService.cards$.subscribe(cards => {
      this.cards.set(cards);
      this.updateStatsMap();

      // Pré-carrega guest stats para todos os cards
      if (cards.length > 0) {
        this.rsvpService.preloadGuestStats(cards.map(c => c.id!).filter(Boolean));
      }
    });
    this.subscriptions.push(cardsSub);

    this.eventService.loadUserEvents();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.card-menu-btn') && !target.closest('.card-dropdown-menu')) {
      this.closeMenu();
    }
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
    return this.authService.displayName() || user?.email?.split('@')[0] || 'Usuário';
  }

  viewCard(cardId: string): void {
    this.router.navigate(['/invite', cardId], { queryParams: { mode: 'view' } });
  }

  editCard(cardId: string): void {
    this.router.navigate(['/manage', cardId]);
  }

  manageGuests(cardId: string): void {
    this.router.navigate(['/manage', cardId], { queryParams: { section: 'guests' } });
  }

  toggleMenu(cardId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.set(this.openMenuId() === cardId ? null : cardId);
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  deleteCard(cardId: string): void {
    this.confirmDeleteId.set(cardId);
  }

  confirmDelete(): void {
    const cardId = this.confirmDeleteId();
    if (!cardId) return;
    this.confirmDeleteId.set(null);
    this.cardService.deleteCard(cardId).catch(error => {
      console.error('Erro ao deletar:', error);
    });
  }

  clearResponses(cardId: string): void {
    this.confirmClearId.set(cardId);
  }

  confirmClear(): void {
    const cardId = this.confirmClearId();
    if (!cardId) return;
    this.confirmClearId.set(null);
    this.rsvpService.clearResponses(cardId).catch(error => {
      console.error('Erro ao limpar respostas:', error);
    });
  }

  copyLink(cardId: string): void {
    // Gera um token único para garantir que o link seja de uso único
    this.inviteTokenService.generateToken(cardId).then(token => {
      const link = `${window.location.origin}/invite/${cardId}/${token}`;
      this.copyToClipboard(link, cardId);
    }).catch(() => {
      // Fallback sem token caso a geração falhe
      const link = `${window.location.origin}/invite/${cardId}`;
      this.copyToClipboard(link, cardId);
    });
  }

  private copyToClipboard(text: string, cardId: string): void {
    // Tenta a API moderna primeiro
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        this.linkCopied.set(cardId);
        setTimeout(() => this.linkCopied.set(null), 2000);
      }).catch(() => {
        // Se falha, usa fallback
        this.copyToClipboardFallback(text, cardId);
      });
    } else {
      // Fallback para navegadores antigos
      this.copyToClipboardFallback(text, cardId);
    }
  }

  private copyToClipboardFallback(text: string, cardId: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.linkCopied.set(cardId);
      setTimeout(() => this.linkCopied.set(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
    document.body.removeChild(textarea);
  }

  shareWhatsApp(card: Card): void {
    if (card.id) {
      const cardId = card.id;
      this.inviteTokenService.generateToken(cardId).then(token => {
        const link = `${window.location.origin}/invite/${cardId}/${token}`;
        const message = `🎉 Olá! Você recebeu um convite especial de ${card.senderName || 'alguém'}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }).catch(error => {
        console.error('Erro ao gerar token:', error);
        // Fallback sem token
        const url = this.cardService.getWhatsAppShareUrl(cardId, card.senderName);
        window.open(url, '_blank');
      });
    }
  }

  createNew(): void {
    this.router.navigate(['/editor']);
  }

  createNewEvent(): void {
    this.router.navigate(['/events/new']);
  }

  openEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
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

  async showGuestPopover(cardId: string): Promise<void> {
    if (this.guestPopoverbCardId() === cardId) return;
    this.guestPopoverbCardId.set(cardId);
    if (this.guestCache.has(cardId)) {
      this.guestPopoverList.set(this.guestCache.get(cardId)!);
      return;
    }
    this.guestPopoverLoading.set(true);
    try {
      const guests = await this.guestService.loadGuestsByCard(cardId);
      this.guestCache.set(cardId, guests);
      this.guestPopoverList.set(guests);
    } catch (error) {
      console.error('Erro ao carregar convidados:', error);
      this.guestPopoverList.set([]);
    } finally {
      this.guestPopoverLoading.set(false);
    }
  }

  hideGuestPopover(): void {
    this.guestPopoverbCardId.set(null);
  }

  getGuestStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendente',
      'sent': 'Enviado',
      'viewed': 'Visualizado',
      'confirmed': 'Confirmado',
      'declined': 'Recusado'
    };
    return labels[status] || status;
  }

  getGuestStatusClass(status: string): string {
    return `status-${status}`;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  getEventStatus(event: AppEvent): EventStatus {
    return computeEventStatus(event);
  }

  getEventStatusLabel(status: EventStatus): string {
    if (status === 'planning') return 'Planejando';
    if (status === 'upcoming') return 'Em breve';
    return 'Realizado';
  }

  async duplicateEvent(event: AppEvent, domEvent: Event): Promise<void> {
    domEvent.stopPropagation();
    try {
      const categories = await this.categoryService.getCategoriesForEvent(event.id!);
      const newId = await this.eventService.createEvent({
        name: `${event.name} (cópia)`,
        eventType: event.eventType,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        eventLocation: event.eventLocation,
        budgetTotal: event.budgetTotal,
        additionalNotes: event.additionalNotes,
      });
      if (categories.length > 0) {
        await Promise.all(
          categories.map(cat => this.categoryService.addCategory({
            eventId: newId,
            name: cat.name,
            notes: cat.notes,
          }))
        );
      }
      this.router.navigate(['/events', newId]);
    } catch (error) {
      console.error('Erro ao duplicar evento:', error);
    }
  }

  getCardScheme(card: Card) {
    return COLOR_SCHEMES.find(s => s.id === card.colorScheme) ?? COLOR_SCHEMES[0];
  }
}
