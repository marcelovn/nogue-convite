import { Component, signal, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth';
import { FeedbackButtonComponent } from './components/feedback-button/feedback-button';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgOptimizedImage, FeedbackButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Convitei');
  private currentRoute = signal('');

  constructor(private router: Router, private authService: AuthService) {
    // Detectar mudanças de rota
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute.set(event.urlAfterRedirects || event.url);
      });
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated;
  }

  async signOut() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
  
  showNavigation = computed(() => {
    const route = this.currentRoute();
    const isPublicInvite = route.startsWith('/invite/');
    const isAuthPage = ['login', 'register', 'reset-password'].some(page => route.includes(page));
    const isWelcome = route === '/' || route === '';

    return this.isAuthenticated() && !isPublicInvite && !isAuthPage && !isWelcome;
  });

  isPublicInvite = computed(() => {
    return this.currentRoute().startsWith('/invite/');
  });
}
