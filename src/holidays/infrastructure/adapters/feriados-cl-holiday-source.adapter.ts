import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import { HolidaysSourceUnavailableError } from '../../application/errors/holidays-source-unavailable.error';
import { HolidaySourcePort } from '../../application/ports/holiday-source.port';
import { Holiday } from '../../domain/models/holiday';

@Injectable()
export class FeriadosClHolidaySourceAdapter implements HolidaySourcePort {
  private readonly baseUrl = 'https://www.feriados.cl';

  async getAvailableYears(): Promise<number[]> {
    const $ = await this.fetchDocument(this.baseUrl);
    const years = new Set<number>();

    $('table#menutarget tbody tr td').each((_index, element) => {
      const yearText = $(element).text().trim();
      const yearMatch = yearText.match(/Feriados Año (\d{4})/);

      if (yearMatch?.[1]) {
        years.add(Number(yearMatch[1]));
      }
    });

    const availableYears = Array.from(years);

    Logger.log(
      `Years: ${JSON.stringify(availableYears)}`,
      FeriadosClHolidaySourceAdapter.name
    );

    if (availableYears.length === 0) {
      throw new HolidaysSourceUnavailableError('No se encontraron años');
    }

    return availableYears;
  }

  async getHolidaysByYear(year: string): Promise<Holiday[]> {
    const currentYear = dayjs().year().toString();
    const targetUrl =
      year === currentYear ? this.baseUrl : `${this.baseUrl}/${year}.htm`;
    const $ = await this.fetchDocument(targetUrl);
    const holidays: Holiday[] = [];

    Logger.log(
      `Obteniendo feriados desde ${this.baseUrl}`,
      FeriadosClHolidaySourceAdapter.name
    );

    $('tbody > tr').each((_index, element) => {
      const dayLabel = $(element).find('td').first().text().trim();
      const normalizedDayLabel = dayLabel
        .replace(/Todos los Días Domingos/g, '')
        .trim();
      const name = this.cleanText(
        $(element).find('td:nth-of-type(2)').text().trim()
      );
      const category = $(element).find('td:nth-of-type(3)').text().trim();
      const legalBasis = this.cleanText($(element).find('td.rl').text().trim());
      const isNonWaivable = /Irrenunciable/.test(name);
      const isPendingConfirmation = /Por Confirmar/.test(name);
      const normalizedName = name
        .replace(/Irrenunciable/g, '')
        .replace(/Por Confirmar/g, '')
        .trim();

      if (!normalizedDayLabel || !normalizedName) {
        return;
      }

      holidays.push({
        dayLabel: normalizedDayLabel,
        name: normalizedName,
        category,
        legalBasis,
        isNonWaivable,
        isConfirmed: !isPendingConfirmation,
        date: this.mapDate(normalizedDayLabel, year)
      });
    });

    return holidays.filter((holiday) => holiday.dayLabel !== '');
  }

  private async fetchDocument(url: string): Promise<cheerio.CheerioAPI> {
    try {
      const response = await axios.get<string>(url);

      return cheerio.load(response.data);
    } catch {
      throw new HolidaysSourceUnavailableError(
        'No se pudieron obtener los feriados'
      );
    }
  }

  private cleanText(value: string): string {
    return value.replace(/[\n\t]+/g, ' ').trim();
  }

  private mapDate(dayLabel: string, year: string): string {
    const [, rawDate] = dayLabel.split(', ');

    if (!rawDate) {
      throw new HolidaysSourceUnavailableError(
        'No se pudieron obtener los feriados'
      );
    }

    const [day, monthName] = rawDate.split(' de ');
    const month = this.parseMonth(monthName);
    const normalizedDay = day.padStart(2, '0');

    return `${year}-${month}-${normalizedDay}`;
  }

  private parseMonth(monthName: string): string {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];
    const monthIndex = months.indexOf(monthName);

    if (monthIndex === -1) {
      throw new HolidaysSourceUnavailableError(
        'No se pudieron obtener los feriados'
      );
    }

    return (monthIndex + 1).toString().padStart(2, '0');
  }
}
