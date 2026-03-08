import { Inject, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { Holiday } from '../../domain/models/holiday';
import { HolidaysSourceUnavailableError } from '../errors/holidays-source-unavailable.error';
import { InvalidYearError } from '../errors/invalid-year.error';
import { YearNotFoundError } from '../errors/year-not-found.error';
import {
  HOLIDAY_SOURCE_PORT,
  HolidaySourcePort
} from '../ports/holiday-source.port';

@Injectable()
export class GetHolidaysUseCase {
  constructor(
    @Inject(HOLIDAY_SOURCE_PORT)
    private readonly holidaySource: HolidaySourcePort
  ) {}

  async execute(requestedYear?: string): Promise<Holiday[]> {
    const year = this.resolveYear(requestedYear);
    const availableYears = await this.holidaySource.getAvailableYears();

    if (availableYears.length === 0) {
      throw new HolidaysSourceUnavailableError('No se encontraron años');
    }

    if (!availableYears.includes(Number.parseInt(year, 10))) {
      throw new YearNotFoundError(year);
    }

    return this.holidaySource.getHolidaysByYear(year);
  }

  private resolveYear(requestedYear?: string): string {
    if (!requestedYear) {
      return dayjs().year().toString();
    }

    const cleanedYear = requestedYear
      .trim()
      .replace(/\s+/g, '')
      .replace(/\D/g, '');
    const parsedYear = Number.parseInt(cleanedYear, 10);

    if (Number.isNaN(parsedYear) || parsedYear.toString() !== cleanedYear) {
      throw new InvalidYearError();
    }

    return parsedYear.toString();
  }
}
