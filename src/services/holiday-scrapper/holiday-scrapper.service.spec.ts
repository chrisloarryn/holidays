import { Test, TestingModule } from '@nestjs/testing';
import { HolidayScrapperService } from './holiday-scrapper.service';

describe('HolidayScrapperService', () => {
  let service: HolidayScrapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HolidayScrapperService],
    }).compile();

    service = module.get<HolidayScrapperService>(HolidayScrapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
