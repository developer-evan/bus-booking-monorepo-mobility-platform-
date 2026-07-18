import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bus, BusSchema } from '../buses/schemas/bus.schema';
import { Route, RouteSchema } from '../routes/schemas/route.schema';
import { Trip, TripSchema } from './schemas/trip.schema';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
      { name: Route.name, schema: RouteSchema },
      { name: Bus.name, schema: BusSchema },
    ]),
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService, MongooseModule],
})
export class TripsModule {}
