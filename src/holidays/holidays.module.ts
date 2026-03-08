import { Module } from '@nestjs/common';
import { CreateHolidayUseCase } from './application/use-cases/create-holiday.use-case';
import { DeleteHolidayUseCase } from './application/use-cases/delete-holiday.use-case';
import { HOLIDAY_SOURCE_PORT } from './application/ports/holiday-source.port';
import { GetHolidayByIdUseCase } from './application/use-cases/get-holiday-by-id.use-case';
import { GetHolidaysUseCase } from './application/use-cases/get-holidays.use-case';
import { UpdateHolidayUseCase } from './application/use-cases/update-holiday.use-case';
import { FeriadosClHolidaySourceAdapter } from './infrastructure/adapters/feriados-cl-holiday-source.adapter';
import { HolidaysController } from './presentation/http/holidays.controller';

@Module({
  controllers: [HolidaysController],
  providers: [
    CreateHolidayUseCase,
    DeleteHolidayUseCase,
    GetHolidayByIdUseCase,
    GetHolidaysUseCase,
    UpdateHolidayUseCase,
    FeriadosClHolidaySourceAdapter,
    {
      provide: HOLIDAY_SOURCE_PORT,
      useExisting: FeriadosClHolidaySourceAdapter
    }
  ]
})
export class HolidaysModule {}
