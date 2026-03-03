import { Injectable, signal, computed } from '@angular/core';
import { EventExpense } from '../models/event.model';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class EventFinanceService {
  readonly expenses = signal<EventExpense[]>([]);

  // Gastos = expense + supplier (excluindo receipt)
  readonly totalCommitted = computed(() =>
    this.expenses()
      .filter(e => e.expenseType !== 'receipt')
      .reduce((sum, e) => sum + e.amount, 0)
  );

  readonly totalPaid = computed(() =>
    this.expenses()
      .filter(e => e.expenseType !== 'receipt' && e.paid)
      .reduce((sum, e) => sum + e.amount, 0)
  );

  readonly totalPending = computed(() =>
    this.expenses()
      .filter(e => e.expenseType !== 'receipt' && !e.paid)
      .reduce((sum, e) => sum + e.amount, 0)
  );

  readonly totalReceipts = computed(() =>
    this.expenses()
      .filter(e => e.expenseType === 'receipt')
      .reduce((sum, e) => sum + e.amount, 0)
  );

  readonly netBalance = computed(() => this.totalReceipts() - this.totalCommitted());

  // Mantidos para compatibilidade com event-finance.ts existente
  readonly totalExpenses = this.totalCommitted;
  readonly totalSuppliers = computed(() => 0);

  constructor(private supabaseService: SupabaseService) {}

  async loadExpensesByEvent(eventId: string): Promise<void> {
    const { data, error } = await this.supabaseService.getClient()
      .from('event_expenses')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    this.expenses.set((data || []).map(this.mapExpense));
  }

  async addExpense(expense: Omit<EventExpense, 'id' | 'createdAt'>): Promise<void> {
    const insertData: any = {
      event_id: expense.eventId,
      description: expense.description,
      amount: expense.amount,
      expense_type: expense.expenseType,
      paid: expense.paid ?? false,
    };

    if (expense.supplierName) insertData.supplier_name = expense.supplierName;
    if (expense.supplierContact) insertData.supplier_contact = expense.supplierContact;
    if (expense.category) insertData.category = expense.category;
    if (expense.dueDate) insertData.due_date = expense.dueDate;

    const { data, error } = await this.supabaseService.getClient()
      .from('event_expenses')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    this.expenses.update(list => [...list, this.mapExpense(data)]);
  }

  async updateExpense(id: string, updates: Partial<EventExpense>): Promise<void> {
    const updateData: any = {};

    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.expenseType !== undefined) updateData.expense_type = updates.expenseType;
    if (updates.paid !== undefined) updateData.paid = updates.paid;
    if (updates.supplierName !== undefined) updateData.supplier_name = updates.supplierName;
    if (updates.supplierContact !== undefined) updateData.supplier_contact = updates.supplierContact;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

    const { error } = await this.supabaseService.getClient()
      .from('event_expenses')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    this.expenses.update(list =>
      list.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  }

  async togglePaid(expense: EventExpense): Promise<void> {
    await this.updateExpense(expense.id!, { paid: !expense.paid });
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('event_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    this.expenses.update(list => list.filter(e => e.id !== id));
  }

  private mapExpense(row: any): EventExpense {
    return {
      id: row.id,
      eventId: row.event_id,
      description: row.description,
      amount: row.amount,
      expenseType: row.expense_type,
      paid: row.paid ?? false,
      category: row.category ?? undefined,
      dueDate: row.due_date ?? undefined,
      supplierName: row.supplier_name ?? undefined,
      supplierContact: row.supplier_contact ?? undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };
  }
}
