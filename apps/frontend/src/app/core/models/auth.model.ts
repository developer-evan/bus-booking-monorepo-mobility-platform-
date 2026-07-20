export type UserRole = 'super_admin' | 'admin' | 'operator' | 'customer';

export interface AuthUser {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  company?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface SendInviteOtpRequest {
  identifier: string;
}

export interface SendInviteOtpResponse {
  message: string;
  otp: string;
  otpExpiresAt: string;
  role?: UserRole;
  email?: string;
  phone?: string;
}

export interface ActivateInviteRequest {
  identifier: string;
  otp: string;
  fullName: string;
  password: string;
}

export const STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'operator'];

export function portalRouteForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/portal/super-admin';
    case 'admin':
      return '/portal/admin';
    case 'operator':
      return '/portal/operator';
    case 'customer':
      return '/portal/customer';
    default:
      return '/';
  }
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Company Admin';
    case 'operator':
      return 'Operator';
    case 'customer':
      return 'Customer';
    default:
      return role;
  }
}
