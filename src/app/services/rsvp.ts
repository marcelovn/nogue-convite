import { Injectable, signal } from '@angular/core';
import { RSVPEntry, RSVPStats } from '../models/card.model';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class RsvpService {
  private entries: RSVPEntry[] = [];
  readonly rsvpEntries = signal<RSVPEntry[]>([]);

  constructor(private supabaseService: SupabaseService) {
    this.loadFromSupabase();
  }

  async addResponse(entry: RSVPEntry): Promise<void> {
    const { data, error } = await this.supabaseService.getClient()
      .from('rsvp_entries')
      .insert([
        {
          card_id: entry.cardId,
          response: entry.response,
          guest_name: entry.guestName,
          guest_email: entry.guestEmail
        }
      ])
      .select();

    if (error) throw error;

    const newEntry: RSVPEntry = {
      id: data[0].id,
      cardId: data[0].card_id,
      response: data[0].response,
      guestName: data[0].guest_name,
      guestEmail: data[0].guest_email,
      timestamp: new Date(data[0].timestamp)
    };

    this.entries.push(newEntry);
    this.rsvpEntries.set([...this.entries]);
  }

  getStats(cardId: string): RSVPStats {
    const cardEntries = this.entries.filter(e => e.cardId === cardId);
    const yes = cardEntries.filter(e => e.response === 'yes').length;
    const no = cardEntries.filter(e => e.response === 'no').length;
    const total = cardEntries.length;

    return {
      cardId,
      total,
      yes,
      no,
      percentageYes: total > 0 ? Math.round((yes / total) * 100) : 0,
    };
  }

  getEntriesByCard(cardId: string): RSVPEntry[] {
    return this.entries.filter(e => e.cardId === cardId);
  }

  private async loadFromSupabase(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('rsvp_entries')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      this.entries = (data || []).map(entry => ({
        id: entry.id,
        cardId: entry.card_id,
        response: entry.response,
        guestName: entry.guest_name,
        guestEmail: entry.guest_email,
        timestamp: new Date(entry.timestamp)
      }));

      this.rsvpEntries.set([...this.entries]);
    } catch (error) {
      console.error('Erro ao carregar RSVPs:', error);
    }
  }
}
