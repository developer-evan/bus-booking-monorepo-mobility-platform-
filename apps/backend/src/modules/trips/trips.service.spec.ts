import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Bus } from '../buses/schemas/bus.schema';
import { Route } from '../routes/schemas/route.schema';
import { Trip } from './schemas/trip.schema';
import { TripsService } from './trips.service';

describe('TripsService', () => {
  let service: TripsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getModelToken(Trip.name),
          useValue: {},
        },
        {
          provide: getModelToken(Route.name),
          useValue: {},
        },
        {
          provide: getModelToken(Bus.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
