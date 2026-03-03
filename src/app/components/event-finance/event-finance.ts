import { Component, inject, Input, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { EventFinanceService } from '../../services/event-finance.service';
import { EventExpense } from '../../models/event.model';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

const EXPENSE_CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'decoracao',   label: 'Decoração'   },
  { id: 'espaco',      label: 'Espaço'      },
  { id: 'musica',      label: 'Música'      },
  { id: 'fotografia',  label: 'Fotografia'  },
  { id: 'transporte',  label: 'Transporte'  },
  { id: 'outros',      label: 'Outros'      },
];

@Component({
  selector: 'app-event-finance',
  imports: [FormsModule, CommonModule, CurrencyPipe, ConfirmDialog],
  templateUrl: './event-finance.html',
  styleUrl: './event-finance.scss',
})
export class EventFinanceComponent implements OnInit {
  @Input({ required: true }) eventId!: string;
  @Input() budgetTotal?: number;

  readonly EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;

  getCategoryLabel(id: string | undefined): string {
    if (!id) return '';
    return EXPENSE_CATEGORIES.find(c => c.id === id)?.label ?? id;
  }

  isOverdue(expense: EventExpense): boolean {
    if (!expense.dueDate || expense.paid) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = expense.dueDate.split('-').map(Number);
    return new Date(y, m - 1, d) < today;
  }

  dueDateLabel(expense: EventExpense): string {
    if (!expense.dueDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = expense.dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `Vencido há ${-diff} dia${-diff !== 1 ? 's' : ''}`;
    if (diff === 0) return 'Vence hoje';
    return `Vence em ${diff} dia${diff !== 1 ? 's' : ''}`;
  }

  private financeService = inject(EventFinanceService);

  readonly expenses       = this.financeService.expenses;
  readonly totalCommitted = this.financeService.totalCommitted;
  readonly totalPaid      = this.financeService.totalPaid;
  readonly totalPending   = this.financeService.totalPending;
  readonly totalReceipts  = this.financeService.totalReceipts;
  readonly netBalance     = this.financeService.netBalance;

  deleteTargetId = signal<string | null>(null);

  readonly budgetProgress = computed(() => {
    if (!this.budgetTotal || this.budgetTotal === 0) return 0;
    return Math.min(100, Math.round((this.totalCommitted() / this.budgetTotal) * 100));
  });

  readonly gastos = computed(() =>
    this.expenses().filter(e => e.expenseType !== 'receipt')
  );

  readonly entradas = computed(() =>
    this.expenses().filter(e => e.expenseType === 'receipt')
  );

  isLoading = signal(false);
  expenseSectionOpen = signal(true);
  receiptSectionOpen = signal(false);

  // Formulário de adição — gastos
  addingExpense = signal(false);
  newExpDesc = signal('');
  newExpAmount = signal('');
  newExpCategory = signal('outros');
  newExpDueDate = signal('');
  newExpSupplierName = signal('');
  newExpSupplierContact = signal('');
  showSupplierFields = signal(false);

  // Formulário de adição — entradas
  addingReceipt = signal(false);
  newRecDesc = signal('');
  newRecAmount = signal('');

  // Edição
  editingId = signal<string | null>(null);
  editDescription = signal('');
  editAmount = signal('');
  editCategory = signal('outros');
  editDueDate = signal('');
  editSupplierName = signal('');
  editSupplierContact = signal('');

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.financeService.loadExpensesByEvent(this.eventId);
    } catch (error) {
      console.error('Erro ao carregar finanças:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async togglePaid(expense: EventExpense): Promise<void> {
    try {
      await this.financeService.togglePaid(expense);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  }

  startAddExpense(): void {
    this.addingExpense.set(true);
    this.newExpDesc.set('');
    this.newExpAmount.set('');
    this.newExpCategory.set('outros');
    this.newExpDueDate.set('');
    this.newExpSupplierName.set('');
    this.newExpSupplierContact.set('');
    this.showSupplierFields.set(false);
    this.editingId.set(null);
  }

  cancelAddExpense(): void {
    this.addingExpense.set(false);
  }

  async confirmAddExpense(): Promise<void> {
    if (!this.newExpDesc().trim() || !this.newExpAmount()) return;
    try {
      await this.financeService.addExpense({
        eventId: this.eventId,
        description: this.newExpDesc().trim(),
        amount: Number(this.newExpAmount()),
        expenseType: 'expense',
        paid: false,
        category: this.newExpCategory() || undefined,
        dueDate: this.newExpDueDate() || undefined,
        supplierName: this.newExpSupplierName().trim() || undefined,
        supplierContact: this.newExpSupplierContact().trim() || undefined,
      });
      this.addingExpense.set(false);
    } catch (error) {
      console.error('Erro ao adicionar gasto:', error);
      alert('Erro ao adicionar. Verifique se a migração do banco foi executada (ALTER TABLE event_expenses ADD COLUMN paid BOOLEAN DEFAULT FALSE).');
    }
  }

  startAddReceipt(): void {
    this.addingReceipt.set(true);
    this.newRecDesc.set('');
    this.newRecAmount.set('');
    this.editingId.set(null);
  }

  cancelAddReceipt(): void {
    this.addingReceipt.set(false);
  }

  async confirmAddReceipt(): Promise<void> {
    if (!this.newRecDesc().trim() || !this.newRecAmount()) return;
    try {
      await this.financeService.addExpense({
        eventId: this.eventId,
        description: this.newRecDesc().trim(),
        amount: Number(this.newRecAmount()),
        expenseType: 'receipt',
      });
      this.addingReceipt.set(false);
    } catch (error) {
      console.error('Erro ao adicionar entrada:', error);
    }
  }

  startEdit(expense: EventExpense): void {
    this.editingId.set(expense.id!);
    this.editDescription.set(expense.description);
    this.editAmount.set(String(expense.amount));
    this.editCategory.set(expense.category ?? 'outros');
    this.editDueDate.set(expense.dueDate ?? '');
    this.editSupplierName.set(expense.supplierName ?? '');
    this.editSupplierContact.set(expense.supplierContact ?? '');
    this.addingExpense.set(false);
    this.addingReceipt.set(false);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async confirmEdit(expense: EventExpense): Promise<void> {
    if (!this.editDescription().trim() || !this.editAmount()) return;
    try {
      await this.financeService.updateExpense(expense.id!, {
        description: this.editDescription().trim(),
        amount: Number(this.editAmount()),
        category: expense.expenseType !== 'receipt' ? this.editCategory() || undefined : undefined,
        dueDate: expense.expenseType !== 'receipt' ? this.editDueDate() || undefined : undefined,
        supplierName: expense.expenseType !== 'receipt' ? this.editSupplierName().trim() || undefined : undefined,
        supplierContact: expense.expenseType !== 'receipt' ? this.editSupplierContact().trim() || undefined : undefined,
      });
      this.editingId.set(null);
    } catch (error) {
      console.error('Erro ao editar:', error);
    }
  }

  async deleteExpense(id: string): Promise<void> {
    this.deleteTargetId.set(id);
  }

  async confirmDeleteExpense(): Promise<void> {
    const id = this.deleteTargetId();
    this.deleteTargetId.set(null);
    if (!id) return;
    try {
      await this.financeService.deleteExpense(id);
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  }
}
