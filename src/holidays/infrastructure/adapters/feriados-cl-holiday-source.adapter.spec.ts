import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dayjs from 'dayjs';
import { HolidaysSourceUnavailableError } from '../../application/errors/holidays-source-unavailable.error';
import { FeriadosClHolidaySourceAdapter } from './feriados-cl-holiday-source.adapter';

jest.mock('axios');

describe('FeriadosClHolidaySourceAdapter', () => {
  const mockedAxios = jest.mocked(axios);
  const adapter = new FeriadosClHolidaySourceAdapter();
  const loadFixture = (fileName: string) =>
    fs.readFileSync(path.join(__dirname, '__fixtures__', fileName), 'utf8');

  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it('should fail when the years menu does not contain any valid year', async () => {
    mockedAxios.get.mockResolvedValue({
      data: '<table id="menutarget"><tbody><tr><td>Sin años</td></tr></tbody></table>'
    } as never);

    await expect(adapter.getAvailableYears()).rejects.toBeInstanceOf(
      HolidaysSourceUnavailableError
    );
  });

  it('should map HTTP failures to a source unavailable error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network error'));

    await expect(adapter.getAvailableYears()).rejects.toBeInstanceOf(
      HolidaysSourceUnavailableError
    );
  });

  it('should parse available years from the feriados menu', async () => {
    mockedAxios.get.mockResolvedValue({
      data: loadFixture('available-years.html')
    } as never);

    await expect(adapter.getAvailableYears()).resolves.toEqual([2026, 2027]);
  });

  it('should parse holidays and map them to the domain model', async () => {
    mockedAxios.get.mockResolvedValue({
      data: loadFixture('holidays-2026.html')
    } as never);

    await expect(adapter.getHolidaysByYear('2026')).resolves.toEqual([
      {
        dayLabel: 'Jueves, 01 de Enero',
        name: 'Año Nuevo',
        category: 'Civil',
        legalBasis: 'Ley 2.977',
        isNonWaivable: true,
        isConfirmed: true,
        date: '2026-01-01'
      },
      {
        dayLabel: 'Viernes, 18 de Septiembre',
        name: 'Independencia Nacional',
        category: 'Civil',
        legalBasis: 'Ley 2.977, Ley 19.973',
        isNonWaivable: false,
        isConfirmed: false,
        date: '2026-09-18'
      }
    ]);
  });

  it('should use the base URL for the current year', async () => {
    mockedAxios.get.mockResolvedValue({
      data: loadFixture('holidays-2026.html')
    } as never);

    await adapter.getHolidaysByYear(dayjs().year().toString());

    expect(mockedAxios.get).toHaveBeenCalledWith('https://www.feriados.cl');
  });

  it('should fail when the holiday row does not include a parsable date', async () => {
    mockedAxios.get.mockResolvedValue({
      data: `
        <table>
          <tbody>
            <tr>
              <td>Jueves 01 de Enero</td>
              <td>Año Nuevo</td>
              <td>Civil</td>
              <td class="rl">Ley 2.977</td>
            </tr>
          </tbody>
        </table>
      `
    } as never);

    await expect(adapter.getHolidaysByYear('2026')).rejects.toBeInstanceOf(
      HolidaysSourceUnavailableError
    );
  });

  it('should skip recurring sunday rows before mapping their date', async () => {
    mockedAxios.get.mockResolvedValue({
      data: `
        <table>
          <tbody>
            <tr>
              <td>Todos los Días Domingos</td>
              <td>Descanso semanal</td>
              <td>Religioso</td>
              <td class="rl">Sin ley</td>
            </tr>
            <tr>
              <td>Jueves, 01 de Enero</td>
              <td>Año Nuevo</td>
              <td>Civil</td>
              <td class="rl">Ley 2.977</td>
            </tr>
          </tbody>
        </table>
      `
    } as never);

    await expect(adapter.getHolidaysByYear('2026')).resolves.toEqual([
      {
        dayLabel: 'Jueves, 01 de Enero',
        name: 'Año Nuevo',
        category: 'Civil',
        legalBasis: 'Ley 2.977',
        isNonWaivable: false,
        isConfirmed: true,
        date: '2026-01-01'
      }
    ]);
  });

  it('should fail when the holiday row uses an unknown month name', async () => {
    mockedAxios.get.mockResolvedValue({
      data: `
        <table>
          <tbody>
            <tr>
              <td>Jueves, 01 de Foo</td>
              <td>Año Nuevo</td>
              <td>Civil</td>
              <td class="rl">Ley 2.977</td>
            </tr>
          </tbody>
        </table>
      `
    } as never);

    await expect(adapter.getHolidaysByYear('2026')).rejects.toBeInstanceOf(
      HolidaysSourceUnavailableError
    );
  });
});
