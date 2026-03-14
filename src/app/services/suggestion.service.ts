import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class SuggestionService {
  private supabase = inject(SupabaseService);

  async submit(userId: string, message: string) {
    return this.supabase.getClient()
      .from('suggestions')
      .insert({ user_id: userId, message });
  }
}
