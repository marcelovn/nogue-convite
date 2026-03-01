import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { SuggestionService } from '../../services/suggestion.service';

@Component({
  selector: 'app-feedback-button',
  standalone: true,
  imports: [],
  templateUrl: './feedback-button.html',
  styleUrl: './feedback-button.scss',
})
export class FeedbackButtonComponent {
  private auth = inject(AuthService);
  private suggestionService = inject(SuggestionService);

  open = signal(false);
  message = signal('');
  status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  async submit() {
    const msg = this.message().trim();
    if (!msg) return;
    this.status.set('loading');
    const userId = this.auth.currentUser()?.id;
    const { error } = await this.suggestionService.submit(userId, msg);
    this.status.set(error ? 'error' : 'success');
  }

  close() {
    this.open.set(false);
    setTimeout(() => {
      this.message.set('');
      this.status.set('idle');
    }, 300);
  }
}
