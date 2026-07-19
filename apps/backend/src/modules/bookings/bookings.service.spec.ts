import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Trip } from '../trips/schemas/trip.schema';
import { TripsService } from '../trips/trips.service';
import { PaymentsService } from '../payments/payments.service';
import { Booking } from './schemas/booking.schema';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken(Booking.name),
          useValue: {},
        },
        {
          provide: getModelToken(Trip.name),
          useValue: {},
        },
        {
          provide: TripsService,
          useValue: {},
        },
        {
          provide: PaymentsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
