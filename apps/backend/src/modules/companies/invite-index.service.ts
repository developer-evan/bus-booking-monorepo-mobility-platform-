import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Invite, InviteDocument } from './schemas/invite.schema';

@Injectable()
export class InviteIndexService implements OnModuleInit {
  private readonly logger = new Logger(InviteIndexService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Invite.name)
    private readonly inviteModel: Model<InviteDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.migrateLegacyInviteIndexes();
      await this.inviteModel.createIndexes();
      this.logger.log('Invite indexes are up to date');
    } catch (error) {
      this.logger.error(
        'Invite index migration failed. Invites may not work until legacy indexes are removed.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async migrateLegacyInviteIndexes() {
    const collection = this.connection.collection('invites');
    const indexes = await collection.indexes();
    const legacyTokenIndex = indexes.find((index) => 'token' in index.key);

    if (legacyTokenIndex?.name) {
      await collection.dropIndex(legacyTokenIndex.name);
      this.logger.log(`Dropped legacy invite index: ${legacyTokenIndex.name}`);
    }

    const unsetResult = await collection.updateMany(
      { token: { $exists: true } },
      { $unset: { token: 1 } },
    );

    if (unsetResult.modifiedCount > 0) {
      this.logger.log(
        `Removed legacy token field from ${unsetResult.modifiedCount} invite(s)`,
      );
    }
  }
}
