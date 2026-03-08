import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Holiday } from '../../domain/models/holiday';
import { HolidaysSourceUnavailableError } from '../../application/errors/holidays-source-unavailable.error';
import { InvalidYearError } from '../../application/errors/invalid-year.error';
import { YearNotFoundError } from '../../application/errors/year-not-found.error';
import { CreateHolidayUseCase } from '../../application/use-cases/create-holiday.use-case';
import { DeleteHolidayUseCase } from '../../application/use-cases/delete-holiday.use-case';
import { GetHolidayByIdUseCase } from '../../application/use-cases/get-holiday-by-id.use-case';
import { GetHolidaysUseCase } from '../../application/use-cases/get-holidays.use-case';
import { UpdateHolidayUseCase } from '../../application/use-cases/update-holiday.use-case';
import { HolidaysController } from './holidays.controller';

describe('HolidaysController', () => {
  let controller: HolidaysController;
  let getHolidaysUseCase: { execute: jest.Mock };
  let createHolidayUseCase: { execute: jest.Mock };
  let getHolidayByIdUseCase: { execute: jest.Mock };
  let updateHolidayUseCase: { execute: jest.Mock };
  let deleteHolidayUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    getHolidaysUseCase = { execute: jest.fn() };
    createHolidayUseCase = { execute: jest.fn() };
    getHolidayByIdUseCase = { execute: jest.fn() };
    updateHolidayUseCase = { execute: jest.fn() };
    deleteHolidayUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HolidaysController],
      providers: [
        { provide: CreateHolidayUseCase, useValue: createHolidayUseCase },
        { provide: GetHolidaysUseCase, useValue: getHolidaysUseCase },
        { provide: GetHolidayByIdUseCase, useValue: getHolidayByIdUseCase },
        { provide: UpdateHolidayUseCase, useValue: updateHolidayUseCase },
        { provide: DeleteHolidayUseCase, useValue: deleteHolidayUseCase }
      ]
    }).compile();

    controller = module.get<HolidaysController>(HolidaysController);
  });

  it('should delegate holiday retrieval and map the response payload', async () => {
    const holidays: Holiday[] = [
      {
        dayLabel: 'Jueves, 01 de Enero',
        name: 'Año Nuevo',
        category: 'Civil',
        legalBasis: 'Ley 2.977',
        isNonWaivable: true,
        isConfirmed: true,
        date: '2026-01-01'
      }
    ];

    getHolidaysUseCase.execute.mockResolvedValue(holidays);

    await expect(controller.findAll({ year: '2026' })).resolves.toEqual([
      {
        dia: 'Jueves, 01 de Enero',
        festividad: 'Año Nuevo',
        tipo: 'Civil',
        respaldoLegal: 'Ley 2.977',
        isIrrenunciable: true,
        isConfirmed: true,
        fecha: '2026-01-01'
      }
    ]);
    expect(getHolidaysUseCase.execute).toHaveBeenCalledWith('2026');
  });

  it('should map invalid year errors to BadRequestException', async () => {
    getHolidaysUseCase.execute.mockRejectedValue(new InvalidYearError());

    await expect(controller.findAll({ year: 'abc' })).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('should map missing year errors to NotFoundException', async () => {
    getHolidaysUseCase.execute.mockRejectedValue(new YearNotFoundError('2028'));

    await expect(controller.findAll({ year: '2028' })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('should map source errors to InternalServerErrorException', async () => {
    getHolidaysUseCase.execute.mockRejectedValue(
      new HolidaysSourceUnavailableError()
    );

    await expect(controller.findAll({ year: '2026' })).rejects.toBeInstanceOf(
      InternalServerErrorException
    );
  });

  it('should map unexpected errors to InternalServerErrorException', async () => {
    getHolidaysUseCase.execute.mockRejectedValue(new Error('boom'));

    await expect(controller.findAll({ year: '2026' })).rejects.toBeInstanceOf(
      InternalServerErrorException
    );
  });

  it('should delegate placeholder create requests', () => {
    createHolidayUseCase.execute.mockReturnValue(
      'This action adds a new holiday'
    );

    expect(controller.create({})).toBe('This action adds a new holiday');
    expect(createHolidayUseCase.execute).toHaveBeenCalled();
  });

  it('should delegate placeholder findOne requests', () => {
    getHolidayByIdUseCase.execute.mockReturnValue(
      'This action returns a #7 holiday'
    );

    expect(controller.findOne('7')).toBe('This action returns a #7 holiday');
    expect(getHolidayByIdUseCase.execute).toHaveBeenCalledWith(7);
  });

  it('should delegate placeholder update requests', () => {
    updateHolidayUseCase.execute.mockReturnValue(
      'This action updates a #7 holiday'
    );

    expect(controller.update('7', {})).toBe('This action updates a #7 holiday');
    expect(updateHolidayUseCase.execute).toHaveBeenCalledWith(7);
  });

  it('should delegate placeholder remove requests', () => {
    deleteHolidayUseCase.execute.mockReturnValue(
      'This action removes a #7 holiday'
    );

    expect(controller.remove('7')).toBe('This action removes a #7 holiday');
    expect(deleteHolidayUseCase.execute).toHaveBeenCalledWith(7);
  });
});
