import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Bus } from './schemas/bus.schema';
import { BusesService } from './buses.service';

describe('BusesService', () => {
  let service: BusesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusesService,
        {
          provide: getModelToken(Bus.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BusesService>(BusesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
