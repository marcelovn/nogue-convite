export interface Card {
  id?: string;
  senderName: string;
  title: string;
  message: string;
  theme: string;
  colorScheme: string;
  noButtonMechanic: 'teleporting' | 'growing-yes' | 'multiplying-yes' | 'shrinking-no';
  floatingEmoji?: string;
  photoUrl?: string;
  musicUrl?: string;
  createdAt?: Date;
  shareLink?: string;
  rsvp?: {
    yes: number;
    no: number;
  };
}

export interface CardTheme {
  id: string;
  name: string;
  font: string;
  description: string;
  isPremium: boolean;
  backgroundColor: string;
  accentColor: string;
}

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface RSVPEntry {
  id?: string;
  cardId: string;
  response: 'yes' | 'no';
  guestName?: string;
  timestamp?: Date;
  guestEmail?: string;
}

export interface RSVPStats {
  cardId: string;
  total: number;
  yes: number;
  no: number;
  percentageYes: number;
}

export interface InviteToken {
  id?: string;
  cardId: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  usedBy?: string;
  createdAt?: Date;
}
