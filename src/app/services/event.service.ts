import { Injectable, signal } from '@angular/core';
import { AppEvent } from '../models/event.model';
import { Card } from '../models/card.model';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  readonly events = signal<AppEvent[]>([]);
  readonly hasLoaded = signal(false);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  async loadUserEvents(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('events')
        .select('*, cards(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: AppEvent[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        eventType: row.event_type,
        eventDate: row.event_date,
        eventTime: row.event_time,
        eventLocation: row.event_location,
        additionalNotes: row.additional_notes,
        budgetTotal: row.budget_total ?? undefined,
        createdAt: new Date(row.created_at),
        card: row.cards?.length > 0 ? this.mapCard(row.cards[0]) : undefined,
      }));

      this.events.set(mapped);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      this.hasLoaded.set(true);
    }
  }

  async createEvent(event: AppEvent): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const insertData: any = {
      user_id: user.id,
      name: event.name,
    };

    if (event.eventType) insertData.event_type = event.eventType;
    if (event.eventDate) insertData.event_date = event.eventDate;
    if (event.eventTime) insertData.event_time = event.eventTime;
    if (event.eventLocation) insertData.event_location = event.eventLocation;
    if (event.additionalNotes) insertData.additional_notes = event.additionalNotes;
    if (event.budgetTotal != null) insertData.budget_total = event.budgetTotal;

    const { data, error } = await this.supabaseService.getClient()
      .from('events')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    const newEvent: AppEvent = {
      id: data.id,
      name: data.name,
      eventType: data.event_type,
      eventDate: data.event_date,
      eventTime: data.event_time,
      eventLocation: data.event_location,
      additionalNotes: data.additional_notes,
      budgetTotal: data.budget_total ?? undefined,
      createdAt: new Date(data.created_at),
    };

    this.events.update(evts => [newEvent, ...evts]);
    return data.id;
  }

  async updateEvent(id: string, updates: Partial<AppEvent>): Promise<void> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.eventType !== undefined) updateData.event_type = updates.eventType;
    if (updates.eventDate !== undefined) updateData.event_date = updates.eventDate;
    if (updates.eventTime !== undefined) updateData.event_time = updates.eventTime;
    if (updates.eventLocation !== undefined) updateData.event_location = updates.eventLocation;
    if (updates.additionalNotes !== undefined) updateData.additional_notes = updates.additionalNotes;
    if (updates.budgetTotal !== undefined) updateData.budget_total = updates.budgetTotal;

    const { error } = await this.supabaseService.getClient()
      .from('events')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    this.events.update(evts =>
      evts.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    this.events.update(evts => evts.filter(e => e.id !== id));
  }

  async getEventById(id: string): Promise<AppEvent | null> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('events')
        .select('*, cards(*)')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        eventType: data.event_type,
        eventDate: data.event_date,
        eventTime: data.event_time,
        eventLocation: data.event_location,
        additionalNotes: data.additional_notes,
        budgetTotal: data.budget_total ?? undefined,
        createdAt: new Date(data.created_at),
        card: data.cards?.length > 0 ? this.mapCard(data.cards[0]) : undefined,
      };
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return null;
    }
  }

  /** Atualiza o evento na lista local após um card ser vinculado a ele */
  attachCardToEvent(eventId: string, card: Card): void {
    this.events.update(evts =>
      evts.map(e => e.id === eventId ? { ...e, card } : e)
    );
  }

  private mapCard(row: any): Card {
    return {
      id: row.id,
      eventId: row.event_id,
      senderName: row.sender_name,
      title: row.title,
      message: row.message,
      theme: row.theme,
      colorScheme: row.color_scheme,
      noButtonMechanic: row.no_button_mechanic,
      challengeModeEnabled: row.challenge_mode_enabled ?? false,
      floatingEmoji: row.floating_emoji,
      photoUrl: row.photo_url,
      musicUrl: row.music_url,
      shareLink: row.share_link,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      rsvp: { yes: row.yes_count ?? 0, no: row.no_count ?? 0 },
    };
  }
}
