import { MODULE_METADATA } from '@nestjs/common/constants';
import { HOLIDAY_SOURCE_PORT } from './application/ports/holiday-source.port';
import { CreateHolidayUseCase } from './application/use-cases/create-holiday.use-case';
import { DeleteHolidayUseCase } from './application/use-cases/delete-holiday.use-case';
import { GetHolidayByIdUseCase } from './application/use-cases/get-holiday-by-id.use-case';
import { GetHolidaysUseCase } from './application/use-cases/get-holidays.use-case';
import { UpdateHolidayUseCase } from './application/use-cases/update-holiday.use-case';
import { FeriadosClHolidaySourceAdapter } from './infrastructure/adapters/feriados-cl-holiday-source.adapter';
import { HolidaysController } from './presentation/http/holidays.controller';
import { HolidaysModule } from './holidays.module';

describe('HolidaysModule', () => {
  it('should register the controller and use cases for the feature', () => {
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      HolidaysModule
    );
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      HolidaysModule
    );

    expect(controllers).toContain(HolidaysController);
    expect(providers).toEqual(
      expect.arrayContaining([
        CreateHolidayUseCase,
        DeleteHolidayUseCase,
        GetHolidayByIdUseCase,
        GetHolidaysUseCase,
        UpdateHolidayUseCase,
        FeriadosClHolidaySourceAdapter,
        expect.objectContaining({
          provide: HOLIDAY_SOURCE_PORT,
          useExisting: FeriadosClHolidaySourceAdapter
        })
      ])
    );
  });
});
