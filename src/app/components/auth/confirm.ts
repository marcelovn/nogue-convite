import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-auth-confirm',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 20px;">
      <div style="font-size: 24px; color: #2563eb;">Processando confirmação de email...</div>
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

  ngOnInit() {
    this.processConfirmation();
  }

  private async processConfirmation() {
    try {
      // Aguardar 2 segundos para Supabase processar o token hash
      await new Promise(resolve => setTimeout(resolve, 2000));

      const client = this.supabaseService.getClient();
      
      // Refreshar sessão para garantir que token foi processado
      const { data: sessionData, error: refreshError } = await client.auth.refreshSession();
      
      console.log('Refresh session:', { sessionData, refreshError });

      if (refreshError) {
        console.error('Erro ao refreshar sessão:', refreshError);
      }

      // Aguardar mais um pouco após refresh
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar usuário autenticado
      const { data: userData, error: userError } = await client.auth.getUser();
      
      console.log('Get user:', { userData, userError });

      if (userData.user) {
        // Email foi confirmado e usuário está autenticado
        console.log('Email confirmado com sucesso, redirecionando para dashboard');
        this.router.navigate(['/dashboard']);
        return;
      }

      // Se não estiver autenticado, ir para login
      console.log('Usuário não autenticado, voltando para login');
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Erro ao confirmar email:', err);
      this.router.navigate(['/login']);
    }
  }
}

