import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Company, CompanySchema } from './schemas/company.schema';
import { Invite, InviteSchema } from './schemas/invite.schema';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { InviteIndexService } from './invite-index.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Invite.name, schema: InviteSchema },
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService, InviteIndexService],
  exports: [CompaniesService, MongooseModule],
})
export class CompaniesModule {}
