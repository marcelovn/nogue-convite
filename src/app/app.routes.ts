import { Routes } from '@angular/router';
import { CardEditor } from './components/card-editor/card-editor';
import { CardPreview } from './components/card-preview/card-preview';
import { RsvpDashboard } from './components/rsvp-dashboard/rsvp-dashboard';
import { LoginComponent } from './components/auth/login';
import { RegisterComponent } from './components/auth/register';
import { AuthConfirmComponent } from './components/auth/confirm';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'auth/confirm', component: AuthConfirmComponent },
  { path: 'editor', component: CardEditor, canActivate: [authGuard] },
  { path: 'preview', component: CardPreview },
  { path: 'invite/:id/:token', component: CardPreview },  // Específica ANTES
  { path: 'invite/:id', component: CardPreview },        // Genérica DEPOIS
  { path: 'dashboard', component: RsvpDashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
