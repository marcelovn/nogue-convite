import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Autenticação
  async signUp(email: string, password: string, displayName: string) {
    const emailRedirectTo = environment.appUrl ||
      (typeof window !== 'undefined' ? window.location.origin : undefined);

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo
      }
    });

    if (!error && data.user) {
      // Criar registro na tabela users
      await this.supabase
        .from('users')
        .insert([{ id: data.user.id, email, display_name: displayName }]);
    }

    return { data, error };
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getCurrentUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  onAuthStateChange(callback: (user: any) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}
