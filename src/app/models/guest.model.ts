export interface Guest {
  id?: string;
  cardId: string;
  name: string;
  phone: string;
  token: string; // token único por convidado
  status: 'pending' | 'sent' | 'viewed' | 'confirmed' | 'declined';
  response?: 'yes' | 'no';
  confirmedAt?: Date;
  viewedAt?: Date;
  sentAt?: Date;
  adults?: number;
  children?: number;
  notes?: string;
  createdAt?: Date;
}

export interface GuestStats {
  total: number;
  sent: number;
  viewed: number;
  confirmed: number;
  declined: number;
  pending: number;
}
