import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UserRole } from '../../modules/users/schemas/user.schema';

export function isPlatformSuperAdmin(user: AuthenticatedUser): boolean {
  return user.role === UserRole.SUPER_ADMIN;
}

export function isCompanyStaff(user: AuthenticatedUser): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.OPERATOR;
}

export function getTenantCompanyId(user: AuthenticatedUser): string | undefined {
  return isCompanyStaff(user) ? user.companyId : undefined;
}
