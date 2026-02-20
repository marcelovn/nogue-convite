import { Routes } from '@angular/router';
import { CardEditor } from './components/card-editor/card-editor';
import { CardPreview } from './components/card-preview/card-preview';
import { RsvpDashboard } from './components/rsvp-dashboard/rsvp-dashboard';
import { LoginComponent } from './components/auth/login';
import { RegisterComponent } from './components/auth/register';
import { authGuard } from './guards/auth.guard';
import { AuthCallbackComponent } from './components/auth/callback';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'editor', component: CardEditor, canActivate: [authGuard] },
  { path: 'preview', component: CardPreview },
  { path: 'invite/:id/:token', component: CardPreview },  // Específica ANTES
  { path: 'invite/:id', component: CardPreview },        // Genérica DEPOIS
  { path: 'dashboard', component: RsvpDashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
