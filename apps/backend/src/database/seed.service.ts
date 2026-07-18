import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
  normalizeEmail,
  normalizePhone,
} from '../common/utils/identifier.util';
import { User, UserDocument, UserRole } from '../modules/users/schemas/user.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    const existingSuperAdmin = await this.userModel
      .findOne({ role: UserRole.SUPER_ADMIN })
      .exec();

    if (existingSuperAdmin) {
      return;
    }

    const email = this.configService.get<string>('seed.superAdminEmail');
    const phone = this.configService.get<string>('seed.superAdminPhone');
    const password = this.configService.get<string>('seed.superAdminPassword');
    const fullName =
      this.configService.get<string>('seed.superAdminFullName') ??
      'Platform Super Admin';

    if (!password || (!email && !phone)) {
      this.logger.warn(
        'Super admin not seeded. Set SUPER_ADMIN_PASSWORD and SUPER_ADMIN_EMAIL or SUPER_ADMIN_PHONE.',
      );
      return;
    }

    await this.userModel.create({
      fullName,
      email: email ? normalizeEmail(email) : undefined,
      phone: phone ? normalizePhone(phone) : undefined,
      password: await bcrypt.hash(password, 10),
      role: UserRole.SUPER_ADMIN,
      company: null,
    });

    this.logger.log('Super admin account seeded successfully');
  }
}
