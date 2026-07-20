import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { portalRouteForRole, UserRole } from '../models/auth.model';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  const user = auth.user();
  return router.createUrlTree([user ? portalRouteForRole(user.role) : '/']);
};

export const roleGuard = (roles: UserRole[]): CanActivateFn => {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const user = auth.user();
    if (user && roles.includes(user.role)) {
      return true;
    }

    if (user) {
      return router.createUrlTree([portalRouteForRole(user.role)]);
    }

    return router.createUrlTree(['/auth/login']);
  };
};

export const customerGuard: CanActivateFn = roleGuard(['customer']);
