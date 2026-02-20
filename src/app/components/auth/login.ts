import { Component, signal, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  isProcessing = signal(false);
  hasConfirmationHash = signal(false);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.processConfirmationLink();
  }

  private async processConfirmationLink() {
    const hash = window.location.hash;
    
    // Verificar se há token de confirmação no hash
    if (hash && hash.includes('access_token') && hash.includes('type=signup')) {
      this.hasConfirmationHash.set(true);
      this.isProcessing.set(true);
      this.message.set('Processando confirmação de email...');
      
      try {
        // Aguardar mais tempo para o Supabase processar o hash interno
        await new Promise(resolve => setTimeout(resolve, 1500));

        const client = this.supabaseService.getClient();
        
        // Usar getUser ao invés de getSession para ter mais precisão
        const { data: userData, error: userError } = await client.auth.getUser();

        if (userData.user) {
          // Email foi confirmado e usuário está autenticado
          this.message.set('Email confirmado com sucesso! Redirecionando...');
          // Limpar hash imediatamente
          window.history.replaceState({}, document.title, window.location.pathname);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          this.router.navigate(['/dashboard']);
          return;
        }

        // Se chegou aqui, possivelmente o link expirou ou não processou
        this.error.set('Link de confirmação expirado ou inválido. Faça login para receber um novo link.');
      } catch (err) {
        console.error('Erro ao processar confirmação:', err);
        this.error.set('Erro ao processar confirmação. Por favor, faça login.');
      } finally {
        this.isProcessing.set(false);
        // Limpar hash para não ficar na URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  async onLogin() {
    if (this.loginForm.invalid || this.isProcessing()) return;

    this.error.set(null);
    const { email, password } = this.loginForm.value;

    const result = await this.authService.login(email, password);
    
    if (result.error) {
      if (this.authService.isEmailNotConfirmedError(result.error)) {
        this.error.set('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (incluindo spam) para o link de confirmação.');
        return;
      }

      this.error.set(this.authService.getAuthErrorMessage(result.error, 'login'));
    }
  }
}
