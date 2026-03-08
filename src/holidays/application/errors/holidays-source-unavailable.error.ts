export class HolidaysSourceUnavailableError extends Error {
  constructor(message = 'No se pudieron obtener los feriados') {
    super(message);
    this.name = 'HolidaysSourceUnavailableError';
  }
}
