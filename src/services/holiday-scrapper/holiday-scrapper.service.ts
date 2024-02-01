import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class HolidayScrapperService {
  private url = 'https://www.feriados.cl';

  private limpiarTexto(texto: string): string {
    return texto.replace(/[\n\t]+/g, ' ').trim();
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

      Logger.log('Years:', years);

      if (years.length === 0)
        throw new InternalServerErrorException('No se encontraron años');

      if (years.length > 0 && year && years.indexOf(parseInt(year)) === -1)
        throw new NotFoundException(
          'El año no existe en la lista de años de feriados.cl'
        );

      if (year && parseInt(year) !== currentYear)
        this.url = `${this.url}/${year}.htm`;

      if (parseInt(year) !== currentYear) response = await axios.get(this.url);

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
            dia,
            festividad: festividadLimpia,
            tipo,
            respaldoLegal: respaldoLegalLimpio,
            isIrrenunciable,
            isConfirmed: !isConfirmed
          });
        }
      });

      feriados = feriados.filter(
        (feriado) => feriado.dia !== 'Todos los Días Domingos'
      );

      return feriados;
    } catch (error) {
      console.error('Error al obtener los feriados:', error);
      throw error;
    }
  }
}
