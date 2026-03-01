import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { EventCategoryService } from '../../services/event-category.service';
import { InviteTokenService } from '../../services/invite-token';
import { CardService } from '../../services/card';
import { GuestService } from '../../services/guest.service';
import { RsvpService } from '../../services/rsvp';
import { AppEvent, EventCategory, NoteItem, EVENT_TYPE_LABELS } from '../../models/event.model';
import { Card } from '../../models/card.model';
import { COLOR_SCHEMES } from '../../models/constants';
import { GuestsManager } from '../guests-manager/guests-manager';
import { EventFinanceComponent } from '../event-finance/event-finance';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-event-detail',
  imports: [CommonModule, FormsModule, GuestsManager, EventFinanceComponent, ConfirmDialog],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.scss',
})
export class EventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private eventService = inject(EventService);
  private categoryService = inject(EventCategoryService);
  private inviteTokenService = inject(InviteTokenService);
  private cardService = inject(CardService);
  private guestService = inject(GuestService);
  private rsvpService = inject(RsvpService);

  event = signal<AppEvent | null>(null);
  isLoading = signal(true);
  linkCopied = signal(false);
  confirmDeleteEventId = signal<string | null>(null);
  confirmDeleteCardId = signal<string | null>(null);

  // Categories
  categories = this.categoryService.categories;
  newCategoryName = signal('');
  showAddCategory = signal(false);
  editingCategoryId = signal<string | null>(null);
  editingCategoryName = signal('');
  newItemDraft = signal<Record<string, string>>({});

  getNewItemDraft(catId: string): string {
    return this.newItemDraft()[catId] ?? '';
  }

  setNewItemDraft(catId: string, value: string): void {
    this.newItemDraft.update(d => ({ ...d, [catId]: value }));
  }

  getNoteItems(notes: string | undefined): NoteItem[] {
    const raw = notes ?? '';
    if (raw.trimStart().startsWith('[')) {
      try {
        return JSON.parse(raw) as NoteItem[];
      } catch {
        // fall through to legacy format
      }
    }
    // Legacy format: plain text lines
    return raw.split('\n').filter(l => l.trim().length > 0).map(text => ({ text, done: false }));
  }

  private serializeItems(items: NoteItem[]): string {
    return JSON.stringify(items);
  }

  async addNoteItem(cat: EventCategory): Promise<void> {
    const text = this.getNewItemDraft(cat.id!).trim();
    if (!text) return;
    const items = this.getNoteItems(cat.notes);
    items.push({ text, done: false });
    await this.updateCategoryNotes(cat, this.serializeItems(items));
    this.setNewItemDraft(cat.id!, '');
  }

  async removeNoteItem(cat: EventCategory, index: number): Promise<void> {
    const items = this.getNoteItems(cat.notes);
    items.splice(index, 1);
    await this.updateCategoryNotes(cat, this.serializeItems(items));
  }

  async toggleNoteItem(cat: EventCategory, index: number): Promise<void> {
    const items = this.getNoteItems(cat.notes);
    items[index] = { ...items[index], done: !items[index].done };
    await this.updateCategoryNotes(cat, this.serializeItems(items));
  }

  // Open sections
  openSection = signal<string | null>('invite');

  readonly card = computed(() => this.event()?.card ?? null);

  readonly guestStats = computed(() => {
    const c = this.card();
    if (!c?.id) return null;

    // Pre-added guests (via Guests Manager)
    const guests = this.guestService.guestsSignal().filter(g => g.cardId === c.id);
    const confirmedGuests = guests.filter(g => g.status === 'confirmed').length;
    const declinedGuests = guests.filter(g => g.status === 'declined').length;
    const pendingGuests = guests.filter(g => g.status !== 'confirmed' && g.status !== 'declined').length;

    // Anonymous RSVPs (via shared invite link)
    const rsvpEntries = this.rsvpService.rsvpEntries().filter(e => e.cardId === c.id);
    const confirmedRsvp = rsvpEntries.filter(e => e.response === 'yes').length;
    const declinedRsvp = rsvpEntries.filter(e => e.response === 'no').length;

    return {
      total: guests.length + rsvpEntries.length,
      confirmed: confirmedGuests + confirmedRsvp,
      declined: declinedGuests + declinedRsvp,
      pending: pendingGuests,
    };
  });

  getCardScheme(card: Card) {
    return COLOR_SCHEMES.find(s => s.id === card.colorScheme) ?? COLOR_SCHEMES[0];
  }

  readonly eventDateFormatted = computed(() => {
    const e = this.event();
    if (!e?.eventDate) return '';
    const [y, m, d] = e.eventDate.split('-');
    return `${d}/${m}/${y}`;
  });

  readonly googleMapsUrl = computed(() => {
    const loc = this.event()?.eventLocation;
    if (!loc) return '';
    return `https://maps.google.com/?q=${encodeURIComponent(loc)}`;
  });

  readonly eventTypeLabel = computed(() => {
    const type = this.event()?.eventType;
    return type ? (EVENT_TYPE_LABELS[type] ?? type) : '';
  });

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (!eventId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadEvent(eventId);
    this.categoryService.loadCategoriesByEvent(eventId);
  }

  private async loadEvent(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const ev = await this.eventService.getEventById(id);
      this.event.set(ev);
      if (ev?.card?.id) {
        await Promise.all([
          this.guestService.loadGuestsByCard(ev.card.id),
          this.rsvpService.reloadFromSupabase(),
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleSection(section: string): void {
    this.openSection.set(this.openSection() === section ? null : section);
  }

  editEvent(): void {
    this.router.navigate(['/events', this.event()?.id, 'edit']);
  }

  createInvite(): void {
    this.router.navigate(['/events', this.event()?.id, 'editor']);
  }

  editInvite(): void {
    const card = this.card();
    if (card?.id) this.router.navigate(['/manage', card.id]);
  }

  viewInvite(): void {
    const card = this.card();
    if (card?.id) this.router.navigate(['/invite', card.id]);
  }

  copyLink(): void {
    const card = this.card();
    if (!card?.id) return;

    this.inviteTokenService.generateToken(card.id).then(token => {
      const link = `${window.location.origin}/invite/${card.id}/${token}`;
      this.copyToClipboard(link);
    }).catch(() => {
      const link = `${window.location.origin}/invite/${card.id}`;
      this.copyToClipboard(link);
    });
  }

  private copyToClipboard(text: string): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 2000);
      });
    }
  }

  shareWhatsApp(): void {
    const card = this.card();
    const ev = this.event();
    if (!card?.id || !ev) return;

    this.inviteTokenService.generateToken(card.id).then(token => {
      const link = `${window.location.origin}/invite/${card.id}/${token}`;
      const message = `🎉 Olá! Você está convidado para ${ev.name}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    });
  }

  deleteInvite(): void {
    this.confirmDeleteCardId.set(this.card()?.id ?? null);
  }

  async confirmDeleteInvite(): Promise<void> {
    const id = this.confirmDeleteCardId();
    if (!id) return;
    this.confirmDeleteCardId.set(null);
    try {
      await this.cardService.deleteCard(id);
      this.event.update(ev => ev ? { ...ev, card: undefined } : ev);
    } catch (error) {
      console.error('Erro ao excluir convite:', error);
    }
  }

  deleteEvent(): void {
    this.confirmDeleteEventId.set(this.event()?.id ?? null);
  }

  async confirmDeleteEvent(): Promise<void> {
    const id = this.confirmDeleteEventId();
    if (!id) return;
    this.confirmDeleteEventId.set(null);
    try {
      await this.eventService.deleteEvent(id);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
    }
  }

  // Categories
  async addCategory(): Promise<void> {
    const name = this.newCategoryName().trim();
    if (!name || !this.event()?.id) return;

    try {
      await this.categoryService.addCategory({ eventId: this.event()!.id!, name });
      this.newCategoryName.set('');
      this.showAddCategory.set(false);
    } catch (error) {
      console.error('Erro ao adicionar seção:', error);
    }
  }

  startEditCategory(cat: EventCategory): void {
    this.editingCategoryId.set(cat.id!);
    this.editingCategoryName.set(cat.name);
  }

  async saveCategory(cat: EventCategory): Promise<void> {
    const name = this.editingCategoryName().trim();
    if (!name) return;
    try {
      await this.categoryService.updateCategory(cat.id!, { name });
      this.editingCategoryId.set(null);
    } catch (error) {
      console.error('Erro ao salvar seção:', error);
    }
  }

  async updateCategoryNotes(cat: EventCategory, notes: string): Promise<void> {
    try {
      await this.categoryService.updateCategory(cat.id!, { notes });
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
    }
  }

  async deleteCategory(id: string): Promise<void> {
    if (!confirm('Excluir esta seção?')) return;
    try {
      await this.categoryService.deleteCategory(id);
    } catch (error) {
      console.error('Erro ao excluir seção:', error);
    }
  }
}
