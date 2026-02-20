import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

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

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Se já estiver autenticado, vai para dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onLogin() {
    if (this.loginForm.invalid) return;

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
