import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import dayjs from 'dayjs';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HOLIDAY_SOURCE_PORT } from './../src/holidays/application/ports/holiday-source.port';
import { Holiday } from './../src/holidays/domain/models/holiday';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const currentYear = dayjs().year();
  const sampleHoliday: Holiday = {
    dayLabel: 'Jueves, 01 de Enero',
    name: 'Año Nuevo',
    category: 'Civil',
    legalBasis: 'Ley 2.977',
    isNonWaivable: true,
    isConfirmed: true,
    date: '2026-01-01'
  };
  const holidaySource = {
    getAvailableYears: jest.fn<Promise<number[]>, []>(),
    getHolidaysByYear: jest.fn<Promise<Holiday[]>, [string]>()
  };

  beforeEach(() => {
    holidaySource.getAvailableYears.mockReset();
    holidaySource.getHolidaysByYear.mockReset();
    holidaySource.getAvailableYears.mockResolvedValue([2026, currentYear]);
    holidaySource.getHolidaysByYear.mockImplementation(async (year: string) => [
      {
        ...sampleHoliday,
        date: `${year}-01-01`
      }
    ]);
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(HOLIDAY_SOURCE_PORT)
      .useValue(holidaySource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/holidays (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/holidays')
      .expect(200);

    expect(response.body).toEqual([
      {
        dia: 'Jueves, 01 de Enero',
        festividad: 'Año Nuevo',
        tipo: 'Civil',
        respaldoLegal: 'Ley 2.977',
        isIrrenunciable: true,
        isConfirmed: true,
        fecha: `${currentYear}-01-01`
      }
    ]);
    expect(holidaySource.getHolidaysByYear).toHaveBeenCalledWith(
      currentYear.toString()
    );
  });

  it('/holidays?year=2026 (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/holidays?year=2026')
      .expect(200);

    expect(response.body).toEqual([
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
  });

  it('/holidays?year=abc (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/holidays?year=abc')
      .expect(400);

    expect(response.body).toEqual({
      message: 'El año no es un número válido',
      error: 'Bad Request',
      statusCode: 400
    });
  });

  it('/holidays (POST)', () => {
    return request(app.getHttpServer())
      .post('/holidays')
      .send({})
      .expect(201)
      .expect('This action adds a new holiday');
  });

  it('/holidays/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/holidays/7')
      .expect(200)
      .expect('This action returns a #7 holiday');
  });

  it('/holidays/:id (PATCH)', () => {
    return request(app.getHttpServer())
      .patch('/holidays/7')
      .send({})
      .expect(200)
      .expect('This action updates a #7 holiday');
  });

  it('/holidays/:id (DELETE)', () => {
    return request(app.getHttpServer())
      .delete('/holidays/7')
      .expect(200)
      .expect('This action removes a #7 holiday');
  });
});
