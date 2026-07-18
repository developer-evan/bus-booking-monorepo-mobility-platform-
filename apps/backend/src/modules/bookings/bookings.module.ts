import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trip, TripSchema } from '../trips/schemas/trip.schema';
import { TripsModule } from '../trips/trips.module';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    TripsModule,
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Trip.name, schema: TripSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService, MongooseModule],
})
export class BookingsModule {}
