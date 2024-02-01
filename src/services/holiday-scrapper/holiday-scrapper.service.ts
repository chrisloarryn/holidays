import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dayjs from 'dayjs';

@Injectable()
export class HolidayScrapperService {
  private readonly url = 'https://www.feriados.cl';

  private limpiarTexto(texto: string): string {
    return texto.replace(/[\n\t]+/g, ' ').trim();
  }

  // parse months from spanish to 01, 02, 03, etc
  private parseMonth(month: string): string {
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

    return (months.indexOf(month) + 1).toString().padStart(2, '0');
  }

  async obtenerFeriados(year?: string): Promise<any[]> {
    const currentYear = new Date().getFullYear();
    try {
      let response = await axios.get(this.url);
      let html = response.data;
      let $ = cheerio.load(html);
      const years: number[] = [];

      $('table#menutarget tbody tr td').each((index, element) => {
        // Obtener el texto de cada elemento que contiene los años
        const yearText = $(element).text().trim();

        // Intentar extraer el año del texto
        const yearMatch = yearText.match(/Feriados Año (\d{4})/);
        if (yearMatch && yearMatch[1]) {
          // Si el texto contiene un año, añadirlo al array
          years.push(Number(yearMatch[1]));
        }
      });

      Logger.log('Years:', JSON.stringify(years));

      if (years.length === 0)
        throw new InternalServerErrorException('No se encontraron años');

      if (years.length > 0 && year && years.indexOf(parseInt(year)) === -1)
        throw new NotFoundException(
          'El año no existe en la lista de años de feriados.cl'
        );

      let newUrl = '';

      if (year && parseInt(year) !== currentYear)
        newUrl = `${this.url}/${year}.htm`;

      if (parseInt(year) !== currentYear) response = await axios.get(newUrl);

      html = response.data;
      $ = cheerio.load(html);
      let feriados = [];

      Logger.log(`Obteniendo feriados desde ${this.url}`);

      $('tbody > tr').each((i, el) => {
        const dia = $(el).find('td').first().text().trim();
        const festividad = $(el).find('td:nth-of-type(2)').text().trim();
        const tipo = $(el).find('td:nth-of-type(3)').text().trim();
        const respaldoLegal = $(el).find('td.rl').text().trim();

        let festividadLimpia = this.limpiarTexto(festividad);
        const isIrrenunciable = /Irrenunciable/.test(festividadLimpia);
        const isConfirmed = /Por Confirmar/.test(festividadLimpia);
        const respaldoLegalLimpio = this.limpiarTexto(respaldoLegal);

        festividadLimpia = festividadLimpia
          .replace(/Irrenunciable/g, '')
          .replace(/Por Confirmar/g, '')
          .trim();

        if (dia && festividad) {
          feriados.push({
            dia: dia.replace(/Todos los Días Domingos/g, ''),
            festividad: festividadLimpia,
            tipo,
            respaldoLegal: respaldoLegalLimpio,
            isIrrenunciable,
            isConfirmed: !isConfirmed
          });
        }
      });

      feriados = feriados
        .filter((feriado) => feriado.dia !== '')
        .map((feriado) => {
          // Lunes, 01 de Enero. parse using dayjs to date format.
          const date = feriado.dia.split(', ')[1];
          let month = date.split(' de ')[1];
          const day = date.split(' de ')[0];
          const yearParsed = year || currentYear;

          month = this.parseMonth(month);
          const dateStr = `${yearParsed}-${month}-${day}`;
          const dateNew = dayjs(dateStr, 'YYYY-MM-DD').format('YYYY-MM-DD');

          return {
            ...feriado,
            fecha: dateNew
          };
        });

      return feriados;
    } catch (error) {
      console.error('Error al obtener los feriados:', error);
      throw error;
    }
  }
}
