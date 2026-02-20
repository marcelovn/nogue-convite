import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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
