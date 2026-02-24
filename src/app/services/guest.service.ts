import { Injectable, signal } from '@angular/core';
import { Guest, GuestStats } from '../models/guest.model';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';
import { RsvpService } from './rsvp';

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private guests: Guest[] = [];
  readonly guestsSignal = signal<Guest[]>([]);

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private rsvpService: RsvpService
  ) {}

  /**
   * Adiciona um convidado e gera token único
   */
  async addGuest(guest: Omit<Guest, 'id' | 'token' | 'createdAt' | 'status'>): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const token = this.generateUniqueToken();
    
    const { data, error } = await this.supabaseService.getClient()
      .from('guests')
      .insert([{
        card_id: guest.cardId,
        name: guest.name,
        phone: guest.phone,
        token: token,
        status: 'pending',
        user_id: user.id
      }])
      .select();

    if (error) throw error;

    const newGuest: Guest = {
      id: data[0].id,
      cardId: data[0].card_id,
      name: data[0].name,
      phone: data[0].phone,
      token: data[0].token,
      status: data[0].status,
      createdAt: new Date(data[0].created_at)
    };

    this.guests.push(newGuest);
    this.guestsSignal.set([...this.guests]);

    return newGuest.id!;
  }

  /**
   * Carrega todos os convidados de um card
   */
  async loadGuestsByCard(cardId: string): Promise<Guest[]> {
    const { data, error } = await this.supabaseService.getClient()
      .from('guests')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    this.guests = (data || []).map(g => ({
      id: g.id,
      cardId: g.card_id,
      name: g.name,
      phone: g.phone,
      token: g.token,
      status: g.status,
      response: g.response,
      confirmedAt: g.confirmed_at ? new Date(g.confirmed_at) : undefined,
      viewedAt: g.viewed_at ? new Date(g.viewed_at) : undefined,
      sentAt: g.sent_at ? new Date(g.sent_at) : undefined,
      adults: g.adults,
      children: g.children,
      notes: g.notes,
      createdAt: new Date(g.created_at)
    }));

    this.guestsSignal.set([...this.guests]);
    return this.guests;
  }

  /**
   * Busca convidado por token
   */
  async getGuestByToken(token: string): Promise<Guest | null> {
    const { data, error } = await this.supabaseService.getClient()
      .from('guests')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      cardId: data.card_id,
      name: data.name,
      phone: data.phone,
      token: data.token,
      status: data.status,
      response: data.response,
      confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined,
      viewedAt: data.viewed_at ? new Date(data.viewed_at) : undefined,
      sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
      adults: data.adults,
      children: data.children,
      notes: data.notes,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Atualiza status do convidado
   */
  async updateGuestStatus(
    guestId: string, 
    status: Guest['status'], 
    updates?: Partial<Guest>
  ): Promise<void> {
    const updateData: any = { status };

    if (updates?.confirmedAt) updateData.confirmed_at = updates.confirmedAt.toISOString();
    if (updates?.viewedAt) updateData.viewed_at = updates.viewedAt.toISOString();
    if (updates?.sentAt) updateData.sent_at = updates.sentAt.toISOString();
    if (updates?.response) updateData.response = updates.response;
    if (updates?.adults !== undefined) updateData.adults = updates.adults;
    if (updates?.children !== undefined) updateData.children = updates.children;
    if (updates?.notes) updateData.notes = updates.notes;

    const { error } = await this.supabaseService.getClient()
      .from('guests')
      .update(updateData)
      .eq('id', guestId);

    if (error) throw error;

    // Atualizar local
    const index = this.guests.findIndex(g => g.id === guestId);
    if (index !== -1) {
      this.guests[index] = { ...this.guests[index], status, ...updates };
      this.guestsSignal.set([...this.guests]);
    }

    // Recarregar estatísticas no RsvpService
    await this.rsvpService.reloadFromSupabase();
  }

  /**
   * Remove um convidado
   */
  async deleteGuest(guestId: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('guests')
      .delete()
      .eq('id', guestId);

    if (error) throw error;

    this.guests = this.guests.filter(g => g.id !== guestId);
    this.guestsSignal.set([...this.guests]);
  }

  /**
   * Remove todos os convidados de um card
   */
  async deleteGuestsByCard(cardId: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('guests')
      .delete()
      .eq('card_id', cardId);

    if (error) throw error;

    this.guests = this.guests.filter(g => g.cardId !== cardId);
    this.guestsSignal.set([...this.guests]);
  }

  /**
   * Gera estatísticas dos convidados
   */
  getStatsByCard(cardId: string): GuestStats {
    const cardGuests = this.guests.filter(g => g.cardId === cardId);
    
    return {
      total: cardGuests.length,
      sent: cardGuests.filter(g => g.status === 'sent' || g.status === 'viewed' || g.status === 'confirmed').length,
      viewed: cardGuests.filter(g => g.status === 'viewed' || g.status === 'confirmed').length,
      confirmed: cardGuests.filter(g => g.status === 'confirmed').length,
      declined: cardGuests.filter(g => g.status === 'declined').length,
      pending: cardGuests.filter(g => g.status === 'pending').length
    };
  }

  /**
   * Gera link do WhatsApp personalizado para convidado
   */
  getWhatsAppLink(guest: Guest, cardTitle: string, senderName: string): string {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${guest.cardId}/${guest.token}`;
    const message = `Olá ${guest.name}! ${senderName} convidou você para: *${cardTitle}*\n\nConfirme sua presença pelo link:\n${inviteUrl}`;
    const phone = guest.phone.replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Marca convidado como "enviado"
   */
  async markAsSent(guestId: string): Promise<void> {
    await this.updateGuestStatus(guestId, 'sent', { sentAt: new Date() });
  }

  /**
   * Marca convidado como "visualizado"
   */
  async markAsViewed(guestId: string): Promise<void> {
    // Atualiza diretamente no Supabase sem depender do array em memória,
    // pois convidados não autenticados nunca populam this.guests.
    await this.updateGuestStatus(guestId, 'viewed', { viewedAt: new Date() });
  }

  /**
   * Registra resposta do convidado
   */
  async recordResponse(
    guestId: string,
    response: 'yes' | 'no',
    token: string,
    adults?: number,
    children?: number
  ): Promise<void> {
    const status = response === 'yes' ? 'confirmed' : 'declined';
    const nowIso = new Date().toISOString();

    const { data, error } = await this.supabaseService.getClient()
      .from('guests')
      .update({
        status,
        response,
        confirmed_at: nowIso,
        adults,
        children,
      })
      .eq('id', guestId)
      .eq('token', token)
      .in('status', ['pending', 'sent', 'viewed'])
      .select('id,status,response,confirmed_at,adults,children');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Este convite já foi respondido anteriormente.');
    }

    const index = this.guests.findIndex(g => g.id === guestId);
    if (index !== -1) {
      this.guests[index] = {
        ...this.guests[index],
        status,
        response,
        confirmedAt: new Date(nowIso),
        adults,
        children,
      };
      this.guestsSignal.set([...this.guests]);
    }

    await this.rsvpService.reloadFromSupabase();
  }

  /**
   * Gera token único e seguro
   */
  private generateUniqueToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Importa lista de convidados em massa (CSV/array)
   */
  async importGuests(cardId: string, guestsList: Array<{name: string, phone: string}>): Promise<void> {
    for (const guest of guestsList) {
      await this.addGuest({ cardId, name: guest.name, phone: guest.phone });
    }
  }
}
