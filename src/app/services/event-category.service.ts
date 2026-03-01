import { Injectable, signal } from '@angular/core';
import { EventCategory } from '../models/event.model';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class EventCategoryService {
  readonly categories = signal<EventCategory[]>([]);

  constructor(private supabaseService: SupabaseService) {}

  async loadCategoriesByEvent(eventId: string): Promise<void> {
    const { data, error } = await this.supabaseService.getClient()
      .from('event_categories')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    this.categories.set((data || []).map(this.mapCategory));
  }

  async addCategory(cat: Omit<EventCategory, 'id' | 'createdAt'>): Promise<void> {
    const nextOrder = this.categories().length;

    const { data, error } = await this.supabaseService.getClient()
      .from('event_categories')
      .insert([{
        event_id: cat.eventId,
        name: cat.name,
        notes: cat.notes ?? '',
        display_order: cat.displayOrder ?? nextOrder,
      }])
      .select()
      .single();

    if (error) throw error;

    this.categories.update(list => [...list, this.mapCategory(data)]);
  }

  async updateCategory(id: string, updates: Partial<EventCategory>): Promise<void> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

    const { error } = await this.supabaseService.getClient()
      .from('event_categories')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    this.categories.update(list =>
      list.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('event_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    this.categories.update(list => list.filter(c => c.id !== id));
  }

  private mapCategory(row: any): EventCategory {
    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      notes: row.notes ?? '',
      displayOrder: row.display_order ?? 0,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };
  }
}
