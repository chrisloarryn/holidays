import dayjs from 'dayjs';
import { Holiday } from '../../domain/models/holiday';
import { HolidaysSourceUnavailableError } from '../errors/holidays-source-unavailable.error';
import { InvalidYearError } from '../errors/invalid-year.error';
import { YearNotFoundError } from '../errors/year-not-found.error';
import { HolidaySourcePort } from '../ports/holiday-source.port';
import { GetHolidaysUseCase } from './get-holidays.use-case';

describe('GetHolidaysUseCase', () => {
  let useCase: GetHolidaysUseCase;
  let holidaySource: jest.Mocked<HolidaySourcePort>;

  beforeEach(() => {
    holidaySource = {
      getAvailableYears: jest.fn(),
      getHolidaysByYear: jest.fn()
    };
    useCase = new GetHolidaysUseCase(holidaySource);
  });

  it('should use the current year when no year is provided', async () => {
    const currentYear = dayjs().year().toString();
    const holidays: Holiday[] = [];

    holidaySource.getAvailableYears.mockResolvedValue([Number(currentYear)]);
    holidaySource.getHolidaysByYear.mockResolvedValue(holidays);

    await expect(useCase.execute()).resolves.toBe(holidays);
    expect(holidaySource.getHolidaysByYear).toHaveBeenCalledWith(currentYear);
  });

  it('should normalize the provided year before loading holidays', async () => {
    holidaySource.getAvailableYears.mockResolvedValue([2026]);
    holidaySource.getHolidaysByYear.mockResolvedValue([]);

    await useCase.execute(' 20 26 ');

    expect(holidaySource.getHolidaysByYear).toHaveBeenCalledWith('2026');
  });

  it('should reject an invalid year before calling the source', async () => {
    await expect(useCase.execute('abc')).rejects.toBeInstanceOf(
      InvalidYearError
    );
    expect(holidaySource.getAvailableYears).not.toHaveBeenCalled();
  });

  it('should reject when the requested year does not exist in the source', async () => {
    holidaySource.getAvailableYears.mockResolvedValue([2025]);

    await expect(useCase.execute('2026')).rejects.toEqual(
      new YearNotFoundError('2026')
    );
  });

  it('should reject when the source returns no years', async () => {
    holidaySource.getAvailableYears.mockResolvedValue([]);

    await expect(useCase.execute('2026')).rejects.toEqual(
      new HolidaysSourceUnavailableError('No se encontraron años')
    );
  });

  it('should propagate source availability errors', async () => {
    const error = new HolidaysSourceUnavailableError(
      'No se pudieron obtener los feriados'
    );

    holidaySource.getAvailableYears.mockRejectedValue(error);

    await expect(useCase.execute('2026')).rejects.toBe(error);
  });

  it('should propagate holiday fetch errors after validating the year', async () => {
    const error = new HolidaysSourceUnavailableError(
      'No se pudieron obtener los feriados'
    );

    holidaySource.getAvailableYears.mockResolvedValue([2026]);
    holidaySource.getHolidaysByYear.mockRejectedValue(error);

    await expect(useCase.execute('2026')).rejects.toBe(error);
  });
});
