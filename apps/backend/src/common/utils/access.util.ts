import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UserRole } from '../../modules/users/schemas/user.schema';

export function assertCompanyResourceAccess(
  user: AuthenticatedUser,
  resourceCompanyId: Types.ObjectId | string | undefined,
): void {
  if (user.role === UserRole.SUPER_ADMIN) {
    return;
  }

  if (!resourceCompanyId || !user.companyId) {
    throw new ForbiddenException('Access denied for this company resource');
  }

  if (resourceCompanyId.toString() !== user.companyId) {
    throw new ForbiddenException('Access denied for this company resource');
  }
}
