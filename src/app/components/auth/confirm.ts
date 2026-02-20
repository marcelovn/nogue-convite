import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-auth-confirm',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 20px;">
      <div style="font-size: 24px; color: #2563eb;">{{ message() }}</div>
      <div style="width: 50px; height: 50px; border: 3px solid #e5e7eb; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `
})
export class AuthConfirmComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabaseService = inject(SupabaseService);
  message = () => 'Processando confirmação de email...';

  ngOnInit() {
    this.processConfirmation();
  }

  private async processConfirmation() {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const client = this.supabaseService.getClient();
      const { data: userData } = await client.auth.getUser();

      if (userData.user) {
        // Email foi confirmado, redirecionar para dashboard
        this.router.navigate(['/dashboard']);
        return;
      }

      // Se não estiver autenticado, ir para login
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Erro ao confirmar email:', err);
      this.router.navigate(['/login']);
    }
  }
}
