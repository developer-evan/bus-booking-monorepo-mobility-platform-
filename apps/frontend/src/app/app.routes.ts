import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import {
  authGuard,
  guestGuard,
  roleGuard,
} from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'book/:tripId',
    loadComponent: () =>
      import('./pages/book/book-trip.component').then((m) => m.BookTripComponent),
  },
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/accept-invite',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/accept-invite.component').then((m) => m.AcceptInviteComponent),
  },
  {
    path: 'portal/customer',
    canActivate: [authGuard, roleGuard(['customer'])],
    loadComponent: () =>
      import('./pages/portal/customer-portal.component').then(
        (m) => m.CustomerPortalComponent,
      ),
  },
  {
    path: 'portal/admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () =>
      import('./pages/portal/admin-portal.component').then((m) => m.AdminPortalComponent),
  },
  {
    path: 'portal/operator',
    canActivate: [authGuard, roleGuard(['operator'])],
    loadComponent: () =>
      import('./pages/portal/operator-portal.component').then(
        (m) => m.OperatorPortalComponent,
      ),
  },
  {
    path: 'portal/super-admin',
    canActivate: [authGuard, roleGuard(['super_admin'])],
    loadComponent: () =>
      import('./pages/portal/super-admin-portal.component').then(
        (m) => m.SuperAdminPortalComponent,
      ),
  },
  {
    path: 'portal',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
