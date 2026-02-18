import { Routes } from '@angular/router';
import { CardEditor } from './components/card-editor/card-editor';
import { CardPreview } from './components/card-preview/card-preview';
import { RsvpDashboard } from './components/rsvp-dashboard/rsvp-dashboard';
import { LoginComponent } from './components/auth/login';
import { RegisterComponent } from './components/auth/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', component: CardEditor, canActivate: [authGuard] },
  { path: 'preview', component: CardPreview, canActivate: [authGuard] },
  { path: 'invite/:id', component: CardPreview },
  { path: 'dashboard', component: RsvpDashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
