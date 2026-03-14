import { Card } from './card.model';

export type EventType =
  | 'birthday'
  | 'baby-shower'
  | 'revelation'
  | 'christening'
  | 'graduation'
  | 'wedding'
  | 'other';

export interface AppEvent {
  id?: string;
  name: string;
  eventType?: EventType;
  eventDate?: string;        // 'YYYY-MM-DD'
  eventTime?: string;        // 'HH:mm'
  eventLocation?: string;
  additionalNotes?: string;
  budgetTotal?: number;
  createdAt?: Date;
  card?: Card;
}

export interface EventExpense {
  id?: string;
  eventId: string;
  description: string;
  amount: number;
  expenseType: 'expense' | 'receipt' | 'supplier';
  paid?: boolean;
  category?: string;     // e.g. 'alimentacao', 'decoracao', 'outros'
  dueDate?: string;      // 'YYYY-MM-DD'
  supplierName?: string;
  supplierContact?: string;
  createdAt?: Date;
}

export interface NoteItem {
  text: string;
  done: boolean;
}

export interface EventCategory {
  id?: string;
  eventId: string;
  name: string;
  notes?: string;
  displayOrder?: number;
  createdAt?: Date;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  'birthday': 'Aniversário',
  'baby-shower': 'Chá de Bebê',
  'revelation': 'Chá Revelação',
  'christening': 'Batizado',
  'graduation': 'Formatura',
  'wedding': 'Casamento',
  'other': 'Outro',
};

export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: 'birthday', label: 'Aniversário' },
  { id: 'baby-shower', label: 'Chá de Bebê' },
  { id: 'revelation', label: 'Chá Revelação' },
  { id: 'christening', label: 'Batizado' },
  { id: 'graduation', label: 'Formatura' },
  { id: 'wedding', label: 'Casamento' },
  { id: 'other', label: 'Outro' },
];

export type EventStatus = 'planning' | 'upcoming' | 'done';

export function computeEventStatus(event: AppEvent | null): EventStatus {
  if (!event?.eventDate) return 'planning';
  const [y, m, d] = event.eventDate.split('-').map(Number);
  const eventDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'done';
  if (diffDays <= 14) return 'upcoming';
  return 'planning';
}
