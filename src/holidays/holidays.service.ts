import { Injectable } from '@nestjs/common';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { HolidayScrapperService } from '../services/holiday-scrapper/holiday-scrapper.service';

@Injectable()
export class HolidaysService {
  constructor(
    private readonly holidayScrapperService: HolidayScrapperService
  ) {}
  create(_createHolidayDto: CreateHolidayDto) {
    return 'This action adds a new holiday';
  }

  findAll(year?: string) {
    return this.holidayScrapperService.obtenerFeriados(year);
  }

  findOne(id: number) {
    return `This action returns a #${id} holiday`;
  }

  update(id: number, _updateHolidayDto: UpdateHolidayDto) {
    return `This action updates a #${id} holiday`;
  }

  remove(id: number) {
    return `This action removes a #${id} holiday`;
  }
}
