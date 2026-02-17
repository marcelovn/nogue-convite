import { Routes } from '@angular/router';
import { CardEditor } from './components/card-editor/card-editor';
import { CardPreview } from './components/card-preview/card-preview';
import { RsvpDashboard } from './components/rsvp-dashboard/rsvp-dashboard';

export const routes: Routes = [
  { path: '', component: CardEditor },
  { path: 'preview', component: CardPreview },
  { path: 'invite/:id', component: CardPreview },
  { path: 'dashboard', component: RsvpDashboard },
  { path: '**', redirectTo: '' },
];
