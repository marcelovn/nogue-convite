import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Nogue-Convites');
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
  
  showNavigation = computed(() => {
    const isPublicInvite = this.currentRoute().startsWith('/invite/');
    const isAuthPage = ['login', 'register'].some(page => this.currentRoute().includes(page));
    
    return this.isAuthenticated() && !isPublicInvite && !isAuthPage;
  });
}
