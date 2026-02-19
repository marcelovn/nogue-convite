import { Injectable, signal } from '@angular/core';
import { RSVPEntry, RSVPStats } from '../models/card.model';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';
import { InviteTokenService } from './invite-token';

@Injectable({
  providedIn: 'root',
})
export class RsvpService {
  private entries: RSVPEntry[] = [];
  readonly rsvpEntries = signal<RSVPEntry[]>([]);
  private hasLoaded = false;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private inviteTokenService: InviteTokenService
  ) {
    // Load RSVPs once when user authenticates
    this.authService.isAuthenticated;
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

    // Avoid duplicates
    if (!this.entries.find(e => e.id === newEntry.id)) {
      this.entries.push(newEntry);
      this.rsvpEntries.set([...this.entries]);
    }
  }

  /**
   * Adiciona resposta RSVP via token de convite
   * Valida o token, marca-o como usado e adiciona a resposta
   */
  async addResponseViaToken(token: string, entry: RSVPEntry): Promise<void> {
    // Validar token
    const cardId = await this.inviteTokenService.validateToken(token);
    if (!cardId) {
      throw new Error('Token inválido, expirado ou já utilizado');
    }

    // Verificar se o cardId do token corresponde ao cardId da entrada
    if (cardId !== entry.cardId) {
      throw new Error('Token não corresponde ao convite');
    }

    // Marcar token como usado
    await this.inviteTokenService.markTokenAsUsed(token, entry.guestEmail);

    // Adicionar a resposta
    await this.addResponse(entry);
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

      const newEntries = (data || []).map(entry => ({
        id: entry.id,
        cardId: entry.card_id,
        response: entry.response,
        guestName: entry.guest_name,
        guestEmail: entry.guest_email,
        timestamp: new Date(entry.timestamp)
      }));

      // Merge with existing, avoiding duplicates
      newEntries.forEach(newEntry => {
        if (!this.entries.find(e => e.id === newEntry.id)) {
          this.entries.push(newEntry);
        }
      });

      this.rsvpEntries.set([...this.entries]);
      this.hasLoaded = true;
    } catch (error) {
      console.error('Erro ao carregar RSVPs:', error);
    }
  }
}
