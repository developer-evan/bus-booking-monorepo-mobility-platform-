import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
  },
  {
    path: 'portal',
    loadComponent: () =>
      import('./pages/portal-placeholder/portal-placeholder.component').then(
        (m) => m.PortalPlaceholderComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
