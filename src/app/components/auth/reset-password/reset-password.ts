import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

function matchPasswordValidator(g: AbstractControl) {
  const p = g.get('password')?.value;
  const c = g.get('confirm')?.value;
  return p === c ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
    },
    { validators: matchPasswordValidator }
  );

  status = signal<'idle' | 'success' | 'error'>('idle');
  errorMsg = signal<string | null>(null);

  async onSubmit() {
    if (this.form.invalid) return;
    this.errorMsg.set(null);
    const { error } = await this.authService.updatePassword(this.form.value.password!);
    if (error) {
      this.status.set('error');
      this.errorMsg.set('Não foi possível redefinir a senha. Tente solicitar um novo link de recuperação.');
    } else {
      this.status.set('success');
      setTimeout(() => this.router.navigate(['/dashboard']), 2500);
    }
  }
}
