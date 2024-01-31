import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class HolidayScrapperService {
  private readonly url = 'https://www.feriados.cl';

  private limpiarTexto(texto: string): string {
    return texto.replace(/[\n\t]+/g, ' ').trim();
  }

  async obtenerFeriados(): Promise<any[]> {
    try {
      const response = await axios.get(this.url);
      const html = response.data;
      const $ = cheerio.load(html);
      const feriados = [];

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
            isConfirmed: !isConfirmed,
          });
        }
      });

      return feriados;
    } catch (error) {
      console.error('Error al obtener los feriados:', error);
      throw error;
    }
  }
}
