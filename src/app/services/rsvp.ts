import { Injectable, signal } from '@angular/core';
import { RSVPEntry, RSVPStats } from '../models/card.model';

@Injectable({
  providedIn: 'root',
})
export class RsvpService {
  private entries: RSVPEntry[] = [];
  readonly rsvpEntries = signal<RSVPEntry[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  addResponse(entry: RSVPEntry): void {
    const newEntry: RSVPEntry = {
      ...entry,
      id: `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    this.entries.push(newEntry);
    this.rsvpEntries.set([...this.entries]);
    this.saveToStorage();
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

  private saveToStorage(): void {
    localStorage.setItem('nogue_rsvp', JSON.stringify(this.entries));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('nogue_rsvp');
    if (stored) {
      this.entries = JSON.parse(stored);
      this.rsvpEntries.set([...this.entries]);
    }
  }
}
