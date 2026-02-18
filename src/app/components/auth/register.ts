import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  async onRegister() {
    if (this.registerForm.invalid) return;

    this.error.set(null);
    const { email, password, displayName } = this.registerForm.value;

    const result = await this.authService.register(email, password, displayName);
    
    if (result.error) {
      this.error.set(result.error.message || 'Erro ao criar conta');
    }
  }
}
