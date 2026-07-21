import { UserRole, portalRouteForRole } from './auth.model';

export interface PortalNavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  disabled?: boolean;
  badge?: string;
}

export function portalNavItemsForRole(role: UserRole): PortalNavItem[] {
  const base = portalRouteForRole(role);

  switch (role) {
    case 'super_admin':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'pi pi-home', route: base },
        { id: 'companies', label: 'Companies', icon: 'pi pi-building', route: `${base}/companies` },
        {
          id: 'reports',
          label: 'Reports',
          icon: 'pi pi-chart-bar',
          disabled: true,
          badge: 'Soon',
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: 'pi pi-cog',
          disabled: true,
          badge: 'Soon',
        },
      ];
    case 'admin':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'pi pi-home', route: base },
        { id: 'company', label: 'Company', icon: 'pi pi-building', route: `${base}/company` },
        { id: 'team', label: 'Team invites', icon: 'pi pi-users', route: `${base}/team` },
        {
          id: 'routes',
          label: 'Routes',
          icon: 'pi pi-map',
          disabled: true,
          badge: 'Soon',
        },
        {
          id: 'buses',
          label: 'Buses',
          icon: 'pi pi-car',
          disabled: true,
          badge: 'Soon',
        },
        {
          id: 'trips',
          label: 'Trips',
          icon: 'pi pi-calendar',
          disabled: true,
          badge: 'Soon',
        },
        {
          id: 'pos',
          label: 'POS bookings',
          icon: 'pi pi-shopping-cart',
          disabled: true,
          badge: 'Soon',
        },
      ];
    case 'operator':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'pi pi-home', route: base },
        { id: 'pos', label: 'POS bookings', icon: 'pi pi-shopping-cart', route: `${base}/pos` },
        { id: 'trips', label: 'Trip operations', icon: 'pi pi-calendar', route: `${base}/trips` },
        {
          id: 'checkin',
          label: 'Passenger check-in',
          icon: 'pi pi-check-circle',
          route: `${base}/check-in`,
        },
      ];
    case 'customer':
      return [
        { id: 'bookings', label: 'My bookings', icon: 'pi pi-ticket', route: base },
      ];
    default:
      return [];
  }
}
