import { Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-event-tutorial',
  templateUrl: './event-tutorial.html',
  styleUrl: './event-tutorial.scss',
})
export class EventTutorialComponent {
  steps = input<{ title: string; text: string }[]>([]);
  closed = output<void>();

  currentStep = signal(0);

  readonly isLast = computed(() => this.currentStep() === this.steps().length - 1);

  readonly progressPercent = computed(() => {
    const total = this.steps().length;
    if (total === 0) return 0;
    return Math.round(((this.currentStep() + 1) / total) * 100);
  });

  next(): void {
    if (this.isLast()) {
      this.closed.emit();
    } else {
      this.currentStep.update(s => s + 1);
    }
  }

  close(): void {
    this.closed.emit();
  }
}
