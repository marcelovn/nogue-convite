import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '../models/card.model';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private cards: Card[] = [];
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  public cards$ = this.cardsSubject.asObservable();

  private currentCard = new BehaviorSubject<Card | null>(null);
  public currentCard$ = this.currentCard.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {
    this.loadCardsFromSupabase();
  }

  async createCard(card: Card): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    const shareLink = this.generateShareLink();
    
    const insertData: any = {
      user_id: user.id,
      sender_name: card.senderName,
      title: card.title,
      message: card.message,
      theme: card.theme,
      color_scheme: card.colorScheme,
      no_button_mechanic: card.noButtonMechanic,
      share_link: shareLink,
      yes_count: 0,
      no_count: 0
    };

    // Only add media URLs if they exist
    if (card.photoUrl) insertData.photo_url = card.photoUrl;
    if (card.musicUrl) insertData.music_url = card.musicUrl;
    
    const { data, error } = await this.supabaseService.getClient()
      .from('cards')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    const newCard = data[0];
    const cardModel: Card = {
      id: newCard.id,
      senderName: newCard.sender_name,
      title: newCard.title,
      message: newCard.message,
      theme: newCard.theme,
      colorScheme: newCard.color_scheme,
      noButtonMechanic: newCard.no_button_mechanic,
      photoUrl: newCard.photo_url,
      musicUrl: newCard.music_url,
      createdAt: new Date(newCard.created_at),
      shareLink: newCard.share_link,
      rsvp: { yes: newCard.yes_count, no: newCard.no_count }
    };
    
    this.cards.push(cardModel);
    this.cardsSubject.next([...this.cards]);
    
    return newCard.id;
  }

  async updateCard(id: string, card: Partial<Card>): Promise<void> {
    const updateData: any = {};
    
    if (card.senderName) updateData.sender_name = card.senderName;
    if (card.title) updateData.title = card.title;
    if (card.message) updateData.message = card.message;
    if (card.theme) updateData.theme = card.theme;
    if (card.colorScheme) updateData.color_scheme = card.colorScheme;
    if (card.noButtonMechanic) updateData.no_button_mechanic = card.noButtonMechanic;
    if (card.photoUrl) updateData.photo_url = card.photoUrl;
    if (card.musicUrl) updateData.music_url = card.musicUrl;

    const { error } = await this.supabaseService.getClient()
      .from('cards')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    const index = this.cards.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cards[index] = { ...this.cards[index], ...card };
      this.cardsSubject.next([...this.cards]);
    }
  }

  getCard(id: string): Card | undefined {
    return this.cards.find(c => c.id === id);
  }

  getAllCards(): Card[] {
    return [...this.cards];
  }

  async getCardFromDb(id: string): Promise<Card | null> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Cartão não encontrado:', error);
        return null;
      }

      const card: Card = {
        id: data.id,
        senderName: data.sender_name,
        title: data.title,
        message: data.message,
        theme: data.theme,
        colorScheme: data.color_scheme,
        noButtonMechanic: data.no_button_mechanic,
        photoUrl: data.photo_url,
        musicUrl: data.music_url,
        createdAt: new Date(data.created_at),
        shareLink: data.share_link,
        rsvp: { yes: data.yes_count, no: data.no_count }
      };
      
      return card;
    } catch (error) {
      console.error('Erro ao buscar cartão:', error);
      return null;
    }
  }

  async deleteCard(id: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) throw error;

    this.cards = this.cards.filter(c => c.id !== id);
    this.cardsSubject.next([...this.cards]);
  }

  setCurrentCard(card: Card | null): void {
    this.currentCard.next(card);
  }

  getCurrentCard(): Observable<Card | null> {
    return this.currentCard.asObservable();
  }

  private generateShareLink(): string {
    return `${window.location.origin}/invite/`;
  }

  getShareLink(cardId: string): string {
    return `${window.location.origin}/invite/${cardId}`;
  }

  getWhatsAppShareUrl(cardId: string, senderName: string): string {
    const link = this.getShareLink(cardId);
    const message = `🎉 Olá! Você recebeu um convite especial de ${senderName || 'alguém'}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  getWhatsAppDirectUrl(phone: string, cardId: string, senderName: string): string {
    const link = this.getShareLink(cardId);
    const message = `🎉 Olá! Você recebeu um convite especial de ${senderName || 'alguém'}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  async uploadFile(file: File, folder: 'photos' | 'music'): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const bucketName = 'card-media';
      const path = `${folder}/${fileName}`;

      console.log('Iniciando upload:', { bucketName, path, fileSize: file.size, fileType: file.type });

      // Primeiro, tenta fazer upload
      const { data, error } = await this.supabaseService.getClient()
        .storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      console.log('Upload bem-sucedido:', data);

      // Tenta obter a URL pública
      const { data: urlData } = this.supabaseService.getClient()
        .storage
        .from(bucketName)
        .getPublicUrl(path);

      const publicUrl = urlData?.publicUrl;
      console.log('URL pública obtida:', publicUrl);

      if (!publicUrl) {
        throw new Error('Não foi possível obter a URL pública do arquivo');
      }

      return publicUrl;
    } catch (error) {
      console.error('Erro completo no uploadFile:', error);
      throw error;
    }
  }

  private async loadCardsFromSupabase(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.cards = (data || []).map(card => ({
        id: card.id,
        senderName: card.sender_name,
        title: card.title,
        message: card.message,
        theme: card.theme,
        colorScheme: card.color_scheme,
        noButtonMechanic: card.no_button_mechanic,
        photoUrl: card.photo_url,
        musicUrl: card.music_url,
        createdAt: new Date(card.created_at),
        shareLink: card.share_link,
        rsvp: { yes: card.yes_count, no: card.no_count }
      }));

      this.cardsSubject.next([...this.cards]);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    }
  }
}
