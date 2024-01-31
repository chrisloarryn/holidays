import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HolidaysModule } from './holidays/holidays.module';
import { HolidayScrapperService } from './services/holiday-scrapper/holiday-scrapper.service';

@Module({
  imports: [HolidaysModule],
  controllers: [AppController],
  providers: [AppService, HolidayScrapperService],
})
export class AppModule {}
