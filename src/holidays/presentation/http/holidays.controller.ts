import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { CreateHolidayUseCase } from '../../application/use-cases/create-holiday.use-case';
import { DeleteHolidayUseCase } from '../../application/use-cases/delete-holiday.use-case';
import { GetHolidayByIdUseCase } from '../../application/use-cases/get-holiday-by-id.use-case';
import { GetHolidaysUseCase } from '../../application/use-cases/get-holidays.use-case';
import { UpdateHolidayUseCase } from '../../application/use-cases/update-holiday.use-case';
import { HolidaysSourceUnavailableError } from '../../application/errors/holidays-source-unavailable.error';
import { InvalidYearError } from '../../application/errors/invalid-year.error';
import { YearNotFoundError } from '../../application/errors/year-not-found.error';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayResponseDto } from './dto/holiday-response.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { toHolidayResponse } from './mappers/holiday-response.mapper';
import { ErrorResponseDto } from '../../../shared/presentation/http/dto/error-response.dto';

@Controller('holidays')
@ApiTags('holidays')
export class HolidaysController {
  constructor(
    private readonly createHolidayUseCase: CreateHolidayUseCase,
    private readonly getHolidaysUseCase: GetHolidaysUseCase,
    private readonly getHolidayByIdUseCase: GetHolidayByIdUseCase,
    private readonly updateHolidayUseCase: UpdateHolidayUseCase,
    private readonly deleteHolidayUseCase: DeleteHolidayUseCase
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a holiday placeholder'
  })
  @ApiBody({
    type: CreateHolidayDto
  })
  @ApiCreatedResponse({
    schema: {
      type: 'string',
      example: 'This action adds a new holiday'
    }
  })
  create(@Body() _createHolidayDto: CreateHolidayDto) {
    return this.createHolidayUseCase.execute();
  }

  @Get()
  @ApiOperation({
    summary: 'List holidays by year'
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: String,
    description: 'Año a consultar'
  })
  @ApiOkResponse({
    type: HolidayResponseDto,
    isArray: true
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto
  })
  @ApiInternalServerErrorResponse({
    type: ErrorResponseDto
  })
  async findAll(@Query() query: QueryParamsDto): Promise<HolidayResponseDto[]> {
    Logger.log(
      `Query params: ${JSON.stringify(query)}`,
      HolidaysController.name
    );

    try {
      const holidays = await this.getHolidaysUseCase.execute(query.year);

      return holidays.map(toHolidayResponse);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a holiday placeholder by id'
  })
  @ApiParam({
    name: 'id',
    type: String,
    example: '7'
  })
  @ApiOkResponse({
    schema: {
      type: 'string',
      example: 'This action returns a #7 holiday'
    }
  })
  findOne(@Param('id') id: string) {
    return this.getHolidayByIdUseCase.execute(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a holiday placeholder by id'
  })
  @ApiParam({
    name: 'id',
    type: String,
    example: '7'
  })
  @ApiBody({
    type: UpdateHolidayDto
  })
  @ApiOkResponse({
    schema: {
      type: 'string',
      example: 'This action updates a #7 holiday'
    }
  })
  update(@Param('id') id: string, @Body() _updateHolidayDto: UpdateHolidayDto) {
    return this.updateHolidayUseCase.execute(+id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a holiday placeholder by id'
  })
  @ApiParam({
    name: 'id',
    type: String,
    example: '7'
  })
  @ApiOkResponse({
    schema: {
      type: 'string',
      example: 'This action removes a #7 holiday'
    }
  })
  remove(@Param('id') id: string) {
    return this.deleteHolidayUseCase.execute(+id);
  }

  private mapError(error: unknown): Error {
    if (error instanceof InvalidYearError) {
      return new BadRequestException(error.message);
    }

    if (error instanceof YearNotFoundError) {
      return new NotFoundException(error.message);
    }

    if (error instanceof HolidaysSourceUnavailableError) {
      return new InternalServerErrorException(error.message);
    }

    return new InternalServerErrorException(
      'No se pudieron obtener los feriados'
    );
  }
}
