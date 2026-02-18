import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<any>(null);
  isLoading = signal(false);
  isAuthenticated = signal(false);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.initAuth();
  }

  private initAuth() {
    // Verificar se há usuário autenticado na sessão
    this.supabaseService.getCurrentUser().then(user => {
      if (user) {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      }
    });

    // Escutar mudanças de autenticação
    this.supabaseService.onAuthStateChange((user) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(!!user);
    });
  }

  async register(email: string, password: string, displayName: string) {
    this.isLoading.set(true);
    try {
      const result = await this.supabaseService.signUp(email, password, displayName);
      if (!result.error) {
        this.router.navigate(['/dashboard']);
      }
      return result;
    } finally {
      this.isLoading.set(false);
    }
  }

  async login(email: string, password: string) {
    this.isLoading.set(true);
    try {
      const result = await this.supabaseService.signIn(email, password);
      if (!result.error) {
        this.router.navigate(['/dashboard']);
      }
      return result;
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout() {
    this.isLoading.set(true);
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/']);
    } finally {
      this.isLoading.set(false);
    }
  }
}
