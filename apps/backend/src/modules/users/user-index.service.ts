import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserIndexService implements OnModuleInit {
  private readonly logger = new Logger(UserIndexService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.migrateLegacyUserIndexes();
      await this.userModel.createIndexes();
      this.logger.log('User indexes are up to date');
    } catch (error) {
      this.logger.error(
        'User index migration failed. User creation may fail until legacy indexes are removed.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async migrateLegacyUserIndexes() {
    const collection = this.connection.collection('users');
    const indexes = await collection.indexes();

    for (const field of ['email', 'phone'] as const) {
      const legacyIndex = indexes.find(
        (index) =>
          field in index.key &&
          index.name !== '_id_' &&
          !index.partialFilterExpression,
      );

      if (legacyIndex?.name) {
        await collection.dropIndex(legacyIndex.name);
        this.logger.log(`Dropped legacy user index: ${legacyIndex.name}`);
      }
    }
  }
}
