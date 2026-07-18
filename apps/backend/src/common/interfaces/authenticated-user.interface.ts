import { UserRole } from '../../modules/users/schemas/user.schema';

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
  companyId?: string;
}
