import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class WelcomeComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  continueAsGuest(): void {
    this.router.navigate(['/editor']);
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated();
  }
}
