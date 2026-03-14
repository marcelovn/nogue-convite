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
  private guestCache: Map<string, any[]> = new Map(); // Cache de guests por cardId

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
    // Conta de rsvp_entries
    const cardEntries = this.entries.filter(e => e.cardId === cardId);
    const rsvpYes = cardEntries.filter(e => e.response === 'yes').length;
    const rsvpNo = cardEntries.filter(e => e.response === 'no').length;

    // Conta de guests confirmados (se estiver em cache)
    const guests = this.guestCache.get(cardId) || [];
    const guestYes = guests.filter((g: any) => g.response === 'yes' || g.status === 'confirmed').length;
    const guestNo = guests.filter((g: any) => g.response === 'no' || g.status === 'declined').length;

    // Combina os dois
    const totalYes = rsvpYes + guestYes;
    const totalNo = rsvpNo + guestNo;
    const total = totalYes + totalNo;

    return {
      cardId,
      total,
      yes: totalYes,
      no: totalNo,
      percentageYes: total > 0 ? Math.round((totalYes / total) * 100) : 0,
    };
  }

  getEntriesByCard(cardId: string): RSVPEntry[] {
    return this.entries.filter(e => e.cardId === cardId);
  }

  /**
   * Limpa/zera todas as respostas RSVP de um convite específico
   */
  async clearResponses(cardId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('rsvp_entries')
        .delete()
        .eq('card_id', cardId);

      if (error) throw error;

      // Remove from local cache
      this.entries = this.entries.filter(e => e.cardId !== cardId);
      this.rsvpEntries.set([...this.entries]);
    } catch (error) {
      console.error('Erro ao limpar respostas:', error);
      throw error;
    }
  }

  /**
   * Recarrega as respostas RSVP do Supabase (útil quando dados foram atualizados externamente)
   */
  async reloadFromSupabase(): Promise<void> {
    this.guestCache.clear(); // Limpa cache de guests
    await this.loadFromSupabase();
  }

  /**
   * Pré-carrega guests de múltiplos cards para cache
   */
  async preloadGuestStats(cardIds: string[]): Promise<void> {
    for (const cardId of cardIds) {
      if (!this.guestCache.has(cardId)) {
        try {
          const { data, error } = await this.supabaseService.getClient()
            .from('guests')
            .select('id, status, response')
            .eq('card_id', cardId);

          if (!error && data) {
            this.guestCache.set(cardId, data);
          }
        } catch (error) {
          console.error(`Erro ao carregar guests para card ${cardId}:`, error);
        }
      }
    }
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
