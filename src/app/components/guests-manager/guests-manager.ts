import { Component, inject, signal, input, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuestService } from '../../services/guest.service';
import { Guest, GuestStats } from '../../models/guest.model';

@Component({
  selector: 'app-guests-manager',
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './guests-manager.html',
  styleUrl: './guests-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestsManager implements OnInit {
  cardId = input.required<string>();
  cardTitle = input.required<string>();
  senderName = input.required<string>();
  
  private guestService = inject(GuestService);
  
  guests = signal<Guest[]>([]);
  stats = signal<GuestStats>({ total: 0, sent: 0, viewed: 0, confirmed: 0, declined: 0, pending: 0 });
  isLoading = signal(true);
  
  newGuestName = signal('');
  newGuestPhone = signal('');
  linkCopied = signal<string | null>(null);
  showImportForm = signal(false);
  bulkImportText = signal('');

  editingGuestId = signal<string | null>(null);
  editGuestName = signal('');
  editGuestPhone = signal('');
  
  importLinesCount = computed(() => {
    return this.bulkImportText()
      .split('\n')
      .filter(line => line.trim() !== '')
      .length;
  });

  async ngOnInit() {
    await this.loadGuests();
  }

  async loadGuests() {
    this.isLoading.set(true);
    try {
      const guests = await this.guestService.loadGuestsByCard(this.cardId());
      this.guests.set(guests);
      this.updateStats();
    } catch (error) {
      console.error('Erro ao carregar convidados:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateStats() {
    const stats = this.guestService.getStatsByCard(this.cardId());
    this.stats.set(stats);
  }

  async addGuest() {
    const name = this.newGuestName().trim();
    const phone = this.newGuestPhone().trim();
    
    if (!name || !phone) {
      alert('Preencha nome e telefone');
      return;
    }

    try {
      await this.guestService.addGuest({
        cardId: this.cardId(),
        name,
        phone
      });
      
      this.newGuestName.set('');
      this.newGuestPhone.set('');
      await this.loadGuests();
    } catch (error) {
      console.error('Erro ao adicionar convidado:', error);
      alert('Erro ao adicionar convidado');
    }
  }

  async deleteGuest(guestId: string, guestName: string) {
    if (!confirm(`Remover ${guestName} da lista?`)) return;
    
    try {
      await this.guestService.deleteGuest(guestId);
      await this.loadGuests();
    } catch (error) {
      console.error('Erro ao remover convidado:', error);
      alert('Erro ao remover convidado');
    }
  }

  sendWhatsApp(guest: Guest) {
    const link = this.guestService.getWhatsAppLink(guest, this.cardTitle(), this.senderName());
    window.open(link, '_blank');
    
    // Marcar como enviado
    this.guestService.markAsSent(guest.id!).then(() => this.loadGuests());
  }

  sendToAll() {
    const pendingGuests = this.guests().filter(g => g.status === 'pending');
    if (pendingGuests.length === 0) {
      alert('Não há convidados pendentes');
      return;
    }

    if (!confirm(`Enviar convite para ${pendingGuests.length} pessoas?`)) return;

    pendingGuests.forEach(guest => {
      setTimeout(() => {
        this.sendWhatsApp(guest);
      }, 300); // Delay para não travar o navegador
    });
  }

  async copyLink(guest: Guest) {
    const link = `${window.location.origin}/invite/${guest.cardId}/${guest.token}`;
    try {
      await navigator.clipboard.writeText(link);
      this.linkCopied.set(guest.id!);
      setTimeout(() => this.linkCopied.set(null), 2000);
    } catch (error) {
      alert('Erro ao copiar link');
    }
  }

  async importBulk() {
    const text = this.bulkImportText().trim();
    if (!text) return;

    const lines = text.split('\n').filter(line => line.trim());
    const guests: Array<{name: string, phone: string}> = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        guests.push({ name: parts[0], phone: parts[1] });
      }
    }

    if (guests.length === 0) {
      alert('Nenhum convidado válido encontrado');
      return;
    }

    if (!confirm(`Importar ${guests.length} convidados?`)) return;

    this.isLoading.set(true);
    try {
      await this.guestService.importGuests(this.cardId(), guests);
      this.bulkImportText.set('');
      this.showImportForm.set(false);
      await this.loadGuests();
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('Erro ao importar convidados');
    } finally {
      this.isLoading.set(false);
    }
  }

  startEditGuest(guest: Guest): void {
    this.editingGuestId.set(guest.id!);
    this.editGuestName.set(guest.name);
    this.editGuestPhone.set(guest.phone);
  }

  cancelEditGuest(): void {
    this.editingGuestId.set(null);
    this.editGuestName.set('');
    this.editGuestPhone.set('');
  }

  async saveEditGuest(guest: Guest): Promise<void> {
    const name = this.editGuestName().trim();
    const phone = this.editGuestPhone().trim();
    if (!name || !phone) return;
    try {
      await this.guestService.updateGuest(guest.id!, { name, phone });
      this.editingGuestId.set(null);
      await this.loadGuests();
    } catch (error) {
      console.error('Erro ao salvar convidado:', error);
    }
  }

  getStatusLabel(status: Guest['status']): string {
    const labels = {
      pending: 'Aguardando',
      sent: 'Enviado',
      viewed: 'Visualizado',
      confirmed: '✓ Confirmado',
      declined: '✗ Recusou'
    };
    return labels[status];
  }

  getStatusClass(status: Guest['status']): string {
    return `status-${status}`;
  }

  exportCsv(): void {
    const guests = this.guests();
    if (!guests.length) return;
    const headers = 'Nome,Telefone,Status,Confirmado em,Adultos,Crian\u00e7as';
    const rows = guests.map(g => [
      `"${g.name.replace(/"/g, '\"')}"`,
      `"${g.phone}"`,
      `"${this.getStatusLabel(g.status)}"`,
      g.confirmedAt ? `"${new Date(g.confirmedAt).toLocaleDateString('pt-BR')}"` : '""',
      g.adults ?? 0,
      g.children ?? 0,
    ].join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `convidados.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  }
}
