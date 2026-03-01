import { Routes } from '@angular/router';
import { CardEditor } from './components/card-editor/card-editor';
import { CardPreview } from './components/card-preview/card-preview';
import { RsvpDashboard } from './components/rsvp-dashboard/rsvp-dashboard';
import { InviteManager } from './components/invite-manager/invite-manager';
import { LoginComponent } from './components/auth/login';
import { RegisterComponent } from './components/auth/register';
import { WelcomeComponent } from './components/welcome/welcome';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password';
import { EventFormComponent } from './components/event-form/event-form';
import { EventDetailComponent } from './components/event-detail/event-detail';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'editor', component: CardEditor, canActivate: [authGuard] },
  { path: 'preview', component: CardPreview },
  { path: 'manage/:id', component: InviteManager, canActivate: [authGuard] },
  { path: 'events/new', component: EventFormComponent, canActivate: [authGuard] },
  { path: 'events/:eventId/edit', component: EventFormComponent, canActivate: [authGuard] },
  { path: 'events/:eventId/editor', component: CardEditor, canActivate: [authGuard] },
  { path: 'events/:eventId', component: EventDetailComponent, canActivate: [authGuard] },
  { path: 'invite/:id/:token', component: CardPreview },  // Específica ANTES
  { path: 'invite/:id', component: CardPreview },        // Genérica DEPOIS
  { path: 'dashboard', component: RsvpDashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
