import { Holiday } from '../../domain/models/holiday';

export const HOLIDAY_SOURCE_PORT = Symbol('HOLIDAY_SOURCE_PORT');

export interface HolidaySourcePort {
  getAvailableYears(): Promise<number[]>;
  getHolidaysByYear(year: string): Promise<Holiday[]>;
}
