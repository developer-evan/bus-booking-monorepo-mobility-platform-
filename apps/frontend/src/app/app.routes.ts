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
    path: 'auth/activate',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/activate-account.component').then(
        (m) => m.ActivateAccountComponent,
      ),
  },
  {
    path: 'auth/accept-invite',
    redirectTo: 'auth/activate',
    pathMatch: 'full',
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
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/portal/admin/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
        data: {
          title: 'Admin dashboard',
          subtitle: 'Company overview, metrics, and quick actions',
        },
      },
      {
        path: 'company',
        loadComponent: () =>
          import('./pages/portal/admin/admin-company.component').then(
            (m) => m.AdminCompanyComponent,
          ),
        data: {
          title: 'Company profile',
          subtitle: 'Contact details and operational readiness',
        },
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./pages/portal/admin/admin-team.component').then((m) => m.AdminTeamComponent),
        data: {
          title: 'Team invites',
          subtitle: 'Invite operators to your company',
        },
      },
    ],
  },
  {
    path: 'portal/operator',
    canActivate: [authGuard, roleGuard(['operator'])],
    loadComponent: () =>
      import('./pages/portal/operator-portal.component').then(
        (m) => m.OperatorPortalComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/portal/operator/operator-dashboard.component').then(
            (m) => m.OperatorDashboardComponent,
          ),
        data: {
          title: 'Operator dashboard',
          subtitle: "Today's trips, bookings, and quick actions",
        },
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./pages/portal/operator/operator-pos.component').then(
            (m) => m.OperatorPosComponent,
          ),
        data: {
          title: 'POS bookings',
          subtitle: 'Create walk-in bookings with immediate cash payment',
        },
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./pages/portal/operator/operator-trips.component').then(
            (m) => m.OperatorTripsComponent,
          ),
        data: {
          title: 'Trip operations',
          subtitle: 'Update boarding, departure, and completion status',
        },
      },
      {
        path: 'check-in',
        loadComponent: () =>
          import('./pages/portal/operator/operator-check-in.component').then(
            (m) => m.OperatorCheckInComponent,
          ),
        data: {
          title: 'Passenger check-in',
          subtitle: 'Look up bookings and mark passengers as boarded',
        },
      },
    ],
  },
  {
    path: 'portal/super-admin',
    canActivate: [authGuard, roleGuard(['super_admin'])],
    loadComponent: () =>
      import('./pages/portal/super-admin-portal.component').then(
        (m) => m.SuperAdminPortalComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/portal/super-admin/super-admin-dashboard.component').then(
            (m) => m.SuperAdminDashboardComponent,
          ),
        data: {
          title: 'Super admin dashboard',
          subtitle: 'Platform metrics and onboarding overview',
        },
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./pages/portal/super-admin/super-admin-companies.component').then(
            (m) => m.SuperAdminCompaniesComponent,
          ),
        data: {
          title: 'Companies',
          subtitle: 'Onboard bus companies and invite their admins',
        },
      },
    ],
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
