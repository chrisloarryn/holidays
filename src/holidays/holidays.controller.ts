import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { QueryParamsDto } from './dto/query-params.dto';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  create(@Body() createHolidayDto: CreateHolidayDto) {
    return this.holidaysService.create(createHolidayDto);
  }

  validateYear(year: string) {
    const cleanedYear = year.trim().replace(/\D/g, '');
    const parsedYear = parseInt(cleanedYear);
    if (isNaN(parsedYear)) {
      throw new BadRequestException('Year is not a number');
    }
  }

  @Get()
  findAll(@Query() query: QueryParamsDto) {
    Logger.log('Query params', JSON.stringify(query));
    const { year } = query;

    if (year) this.validateYear(year);

    return this.holidaysService.findAll(year);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holidaysService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHolidayDto: UpdateHolidayDto) {
    return this.holidaysService.update(+id, updateHolidayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(+id);
  }
}
