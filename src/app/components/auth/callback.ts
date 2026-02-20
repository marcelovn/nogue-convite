import { Component, effect, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 20px;">
      <div style="font-size: 24px; color: #2563eb;">Processando confirmação...</div>
      <div style="width: 50px; height: 50px; border: 3px solid #e5e7eb; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabaseService = inject(SupabaseService);

  ngOnInit() {
    this.processAuthCallback();
  }

  private async processAuthCallback() {
    try {
      // Verificar se há sessão já estabelecida pelo Supabase
      const client = this.supabaseService.getClient();
      const { data } = await client.auth.getSession();

      if (data.session) {
        // Se houver sessão, usuario já foi autenticado
        this.router.navigate(['/dashboard']);
        return;
      }

      // Se não houver sessão, tentar processar hash manualmente
      const hash = window.location.hash;
      if (hash) {
        // Aguardar um pouco para o Supabase processar o hash
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData.session) {
          this.router.navigate(['/dashboard']);
          return;
        }
      }

      // Se nada funcionou, voltar para login
      this.router.navigate(['/login'], {
        queryParams: { reason: 'confirmation_failed' }
      });
    } catch (error) {
      console.error('Erro ao processar callback:', error);
      this.router.navigate(['/login'], {
        queryParams: { reason: 'confirmation_error' }
      });
    }
  }
}
