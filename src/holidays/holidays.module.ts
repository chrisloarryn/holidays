import { Module } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { HolidaysController } from './holidays.controller';
import { HolidayScrapperService } from '../services/holiday-scrapper/holiday-scrapper.service';

@Module({
  controllers: [HolidaysController],
  providers: [HolidayScrapperService, HolidaysService],
})
export class HolidaysModule {}
