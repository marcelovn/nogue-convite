import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AppEvent, EVENT_TYPES } from '../../models/event.model';

@Component({
  selector: 'app-event-form',
  imports: [FormsModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.scss',
})
export class EventFormComponent implements OnInit {
  private eventService = inject(EventService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly EVENT_TYPES = EVENT_TYPES;

  name = signal('');
  eventType = signal('');
  eventDate = signal('');
  eventTime = signal('');
  eventLocation = signal('');
  additionalNotes = signal('');
  budgetTotal = signal<string>('');
  isLoading = signal(false);
  isEditMode = signal(false);
  editEventId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('eventId');
    if (id) {
      this.isEditMode.set(true);
      this.editEventId.set(id);
      this.loadEvent(id);
    }
  }

  private async loadEvent(id: string): Promise<void> {
    const event = await this.eventService.getEventById(id);
    if (!event) return;

    this.name.set(event.name);
    this.eventType.set(event.eventType ?? '');
    this.eventDate.set(event.eventDate ?? '');
    this.eventTime.set(event.eventTime ?? '');
    this.eventLocation.set(event.eventLocation ?? '');
    this.additionalNotes.set(event.additionalNotes ?? '');
    this.budgetTotal.set(event.budgetTotal != null ? String(event.budgetTotal) : '');
  }

  async save(): Promise<void> {
    if (!this.name().trim()) {
      alert('O nome do evento é obrigatório.');
      return;
    }

    const payload: AppEvent = {
      name: this.name().trim(),
      eventType: (this.eventType() || undefined) as AppEvent['eventType'],
      eventDate: this.eventDate() || undefined,
      eventTime: this.eventTime() || undefined,
      eventLocation: this.eventLocation().trim() || undefined,
      additionalNotes: this.additionalNotes().trim() || undefined,
      budgetTotal: this.budgetTotal() ? Number(this.budgetTotal()) : undefined,
    };

    try {
      this.isLoading.set(true);

      if (this.isEditMode() && this.editEventId()) {
        await this.eventService.updateEvent(this.editEventId()!, payload);
        await this.router.navigate(['/events', this.editEventId()]);
      } else {
        const id = await this.eventService.createEvent(payload);
        await this.router.navigate(['/events', id]);
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel(): void {
    if (this.isEditMode() && this.editEventId()) {
      this.router.navigate(['/events', this.editEventId()]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
