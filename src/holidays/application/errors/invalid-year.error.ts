export class InvalidYearError extends Error {
  constructor() {
    super('El año no es un número válido');
    this.name = 'InvalidYearError';
  }
}
