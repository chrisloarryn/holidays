export class YearNotFoundError extends Error {
  constructor(year: string) {
    super(`El año no existe en la lista de años de feriados.cl (${year})`);
    this.name = 'YearNotFoundError';
  }
}
