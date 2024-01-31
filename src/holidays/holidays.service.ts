import { Injectable } from '@nestjs/common';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { HolidayScrapperService } from '../services/holiday-scrapper/holiday-scrapper.service';

@Injectable()
export class HolidaysService {
  constructor(
    private readonly holidayScrapperService: HolidayScrapperService,
  ) {}
  create(createHolidayDto: CreateHolidayDto) {
    return 'This action adds a new holiday';
  }

  findAll() {
    return this.holidayScrapperService.obtenerFeriados();
  }

  findOne(id: number) {
    return `This action returns a #${id} holiday`;
  }

  update(id: number, updateHolidayDto: UpdateHolidayDto) {
    return `This action updates a #${id} holiday`;
  }

  remove(id: number) {
    return `This action removes a #${id} holiday`;
  }
}
