import { Holiday } from '../../../domain/models/holiday';
import { HolidayResponseDto } from '../dto/holiday-response.dto';

export function toHolidayResponse(holiday: Holiday): HolidayResponseDto {
  return {
    dia: holiday.dayLabel,
    festividad: holiday.name,
    tipo: holiday.category,
    respaldoLegal: holiday.legalBasis,
    isIrrenunciable: holiday.isNonWaivable,
    isConfirmed: holiday.isConfirmed,
    fecha: holiday.date
  };
}
