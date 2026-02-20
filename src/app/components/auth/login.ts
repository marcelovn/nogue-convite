import { Component, signal, OnInit } from '@angular/core';
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
      this.isProcessing.set(true);
      try {
        // Aguardar um pouco para o Supabase processar o hash interno
        await new Promise(resolve => setTimeout(resolve, 1000));

        const client = this.supabaseService.getClient();
        const { data, error } = await client.auth.getSession();

        if (data.session) {
          // Email foi confirmado e sessão foi criada
          this.message.set('Email confirmado com sucesso! Redirecionando...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          this.router.navigate(['/dashboard']);
          return;
        }

        if (error) {
          this.error.set('Erro ao confirmar email. Tente fazer login manualmente.');
        }
      } catch (err) {
        console.error('Erro ao processar confirmação:', err);
        this.error.set('Erro ao processar confirmação. Tente fazer login manualmente.');
      } finally {
        this.isProcessing.set(false);
        // Limpar hash para não ficar na URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  async onLogin() {
    if (this.loginForm.invalid) return;

    this.error.set(null);
    const { email, password } = this.loginForm.value;

    const result = await this.authService.login(email, password);
    
    if (result.error) {
      if (this.authService.isEmailNotConfirmedError(result.error)) {
        const resendResult = await this.authService.resendSignupConfirmation(email);

        if (!resendResult.error) {
          this.error.set('Seu e-mail ainda não foi confirmado. Enviamos um novo link de confirmação. Verifique sua caixa de entrada e spam.');
          return;
        }
      }

      this.error.set(this.authService.getAuthErrorMessage(result.error, 'login'));
    }
  }
}
