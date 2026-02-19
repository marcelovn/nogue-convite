import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import { InviteToken } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class InviteTokenService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Gera um token único para um convite
   * Token expira em 7 dias
   */
  async generateToken(cardId: string): Promise<string> {
    const token = this.createRandomToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    const { error } = await this.supabaseService.getClient()
      .from('invite_tokens')
      .insert([{
        card_id: cardId,
        token,
        expires_at: expiresAt.toISOString()
      }]);

    if (error) {
      console.error('Erro ao criar token:', error);
      throw error;
    }

    return token;
  }

  /**
   * Valida um token e retorna o ID do convite
   * Retorna null se token for inválido ou expirado
   */
  async validateToken(token: string): Promise<string | null> {
    const { data, error } = await this.supabaseService.getClient()
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      console.error('Token não encontrado:', error);
      return null;
    }

    const inviteToken: InviteToken = {
      id: data.id,
      cardId: data.card_id,
      token: data.token,
      expiresAt: new Date(data.expires_at),
      usedAt: data.used_at ? new Date(data.used_at) : undefined,
      usedBy: data.used_by,
      createdAt: data.created_at ? new Date(data.created_at) : undefined
    };

    // Verificar se token expirou
    if (new Date() > inviteToken.expiresAt) {
      console.error('Token expirado');
      return null;
    }

    // Verificar se token já foi usado
    if (inviteToken.usedAt) {
      console.error('Token já foi utilizado');
      return null;
    }

    return inviteToken.cardId;
  }

  /**
   * Verifica o status de um token SEM consumir/validar
   * Apenas checa se está expirado ou já foi usado
   * Retorna { isValid: boolean, alreadyUsed: boolean, expired: boolean }
   */
  async checkTokenStatus(token: string): Promise<{ isValid: boolean; alreadyUsed: boolean; expired: boolean }> {
    const { data, error } = await this.supabaseService.getClient()
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      console.error('Token não encontrado:', error);
      return { isValid: false, alreadyUsed: false, expired: false };
    }

    const inviteToken: InviteToken = {
      id: data.id,
      cardId: data.card_id,
      token: data.token,
      expiresAt: new Date(data.expires_at),
      usedAt: data.used_at ? new Date(data.used_at) : undefined,
      usedBy: data.used_by,
      createdAt: data.created_at ? new Date(data.created_at) : undefined
    };

    const alreadyUsed = !!inviteToken.usedAt;
    const expired = new Date() > inviteToken.expiresAt;
    const isValid = !alreadyUsed && !expired;

    return { isValid, alreadyUsed, expired };
  }

  /**
   * Marca um token como usado
   */
  async markTokenAsUsed(token: string, guestEmail?: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('invite_tokens')
      .update({
        used_at: new Date().toISOString(),
        used_by: guestEmail || 'anonymous'
      })
      .eq('token', token);

    if (error) {
      console.error('Erro ao marcar token como usado:', error);
      throw error;
    }
  }

  /**
   * Gera um token aleatório seguro
   */
  private createRandomToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Obtém todos os tokens de um convite
   */
  async getTokensByCard(cardId: string): Promise<InviteToken[]> {
    const { data, error } = await this.supabaseService.getClient()
      .from('invite_tokens')
      .select('*')
      .eq('card_id', cardId);

    if (error) {
      console.error('Erro ao buscar tokens:', error);
      return [];
    }

    return (data || []).map(token => ({
      id: token.id,
      cardId: token.card_id,
      token: token.token,
      expiresAt: new Date(token.expires_at),
      usedAt: token.used_at ? new Date(token.used_at) : undefined,
      usedBy: token.used_by,
      createdAt: token.created_at ? new Date(token.created_at) : undefined
    }));
  }
}
