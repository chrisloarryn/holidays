import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import {
  bootstrap,
  createApp,
  setupOpenApi,
  shouldEnableOpenApi
} from './main';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn()
  }
}));

jest.mock('@nestjs/swagger', () => {
  const actual = jest.requireActual('@nestjs/swagger');

  return {
    ...actual,
    DocumentBuilder: jest.fn().mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({ openapi: '3.0.0' })
    })),
    SwaggerModule: {
      ...actual.SwaggerModule,
      createDocument: jest.fn().mockReturnValue({ openapi: '3.0.0' }),
      setup: jest.fn()
    }
  };
});

describe('main bootstrap', () => {
  const originalEnv = process.env;
  const mockedNestFactory = jest.mocked(NestFactory);
  const mockedSwaggerModule = jest.mocked(SwaggerModule);

  beforeEach(() => {
    process.env = {
      ...originalEnv
    };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should enable OpenAPI for validate-like environments', () => {
    expect(shouldEnableOpenApi({ NODE_ENV: 'validate' })).toBe(true);
    expect(shouldEnableOpenApi({ NODE_ENV: 'development' })).toBe(true);
    expect(shouldEnableOpenApi({ ENABLE_OPENAPI: 'true' })).toBe(true);
    expect(shouldEnableOpenApi({ NODE_ENV: 'production' })).toBe(false);
  });

  it('should configure validation pipes and OpenAPI when creating the app', async () => {
    process.env.NODE_ENV = 'test';
    const app = {
      useGlobalPipes: jest.fn()
    };

    mockedNestFactory.create.mockResolvedValue(app as never);

    await expect(createApp()).resolves.toBe(app);
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
    expect(mockedSwaggerModule.createDocument).toHaveBeenCalledWith(
      app,
      expect.any(Object)
    );
    expect(mockedSwaggerModule.setup).toHaveBeenCalledWith(
      'api-docs',
      app,
      { openapi: '3.0.0' },
      {
        jsonDocumentUrl: 'api-docs-json'
      }
    );
  });

  it('should skip OpenAPI setup when disabled', () => {
    process.env.NODE_ENV = 'production';
    const app = {};

    setupOpenApi(app as never);

    expect(mockedSwaggerModule.createDocument).not.toHaveBeenCalled();
    expect(mockedSwaggerModule.setup).not.toHaveBeenCalled();
  });

  it('should listen on the configured port during bootstrap', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '3456';
    const app = {
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined)
    };

    mockedNestFactory.create.mockResolvedValue(app as never);

    await expect(bootstrap()).resolves.toBe(app);
    expect(app.listen).toHaveBeenCalledWith(3456);
  });
});
