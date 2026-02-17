import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '../models/card.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private cards: Card[] = [];
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  public cards$ = this.cardsSubject.asObservable();

  private currentCard = new BehaviorSubject<Card | null>(null);
  public currentCard$ = this.currentCard.asObservable();

  constructor() {
    this.loadCardsFromStorage();
  }

  createCard(card: Card): string {
    const newCard: Card = {
      ...card,
      id: this.generateId(),
      createdAt: new Date(),
      shareLink: this.generateShareLink(),
      rsvp: { yes: 0, no: 0 }
    };
    
    this.cards.push(newCard);
    this.saveCardsToStorage();
    this.cardsSubject.next([...this.cards]);
    
    return newCard.id!;
  }

  updateCard(id: string, card: Partial<Card>): void {
    const index = this.cards.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cards[index] = { ...this.cards[index], ...card };
      this.saveCardsToStorage();
      this.cardsSubject.next([...this.cards]);
    }
  }

  getCard(id: string): Card | undefined {
    return this.cards.find(c => c.id === id);
  }

  getAllCards(): Card[] {
    return [...this.cards];
  }

  deleteCard(id: string): void {
    this.cards = this.cards.filter(c => c.id !== id);
    this.saveCardsToStorage();
    this.cardsSubject.next([...this.cards]);
  }

  setCurrentCard(card: Card | null): void {
    this.currentCard.next(card);
  }

  getCurrentCard(): Observable<Card | null> {
    return this.currentCard.asObservable();
  }

  private generateId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateShareLink(): string {
    return `${window.location.origin}/invite/`;
  }

  getShareLink(cardId: string): string {
    return `${window.location.origin}/invite/${cardId}`;
  }

  getWhatsAppShareUrl(cardId: string, recipientName: string, senderName: string): string {
    const link = this.getShareLink(cardId);
    const message = `🎉 Olá ${recipientName || 'amigo(a)'}! Você recebeu um convite especial de ${senderName || 'alguém'}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  getWhatsAppDirectUrl(phone: string, cardId: string, recipientName: string, senderName: string): string {
    const link = this.getShareLink(cardId);
    const message = `🎉 Olá ${recipientName || 'amigo(a)'}! Você recebeu um convite especial de ${senderName || 'alguém'}!\n\n💌 Abra o convite e confirme sua presença:\n${link}`;
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  private saveCardsToStorage(): void {
    localStorage.setItem('nogue_cards', JSON.stringify(this.cards));
  }

  private loadCardsFromStorage(): void {
    const stored = localStorage.getItem('nogue_cards');
    if (stored) {
      this.cards = JSON.parse(stored);
      this.cardsSubject.next([...this.cards]);
    }
  }
}
