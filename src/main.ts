import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export function shouldEnableOpenApi(
  environment: NodeJS.ProcessEnv = process.env
): boolean {
  return (
    environment.ENABLE_OPENAPI === 'true' ||
    environment.NODE_ENV === 'development' ||
    environment.NODE_ENV === 'test' ||
    environment.NODE_ENV === 'validate'
  );
}

export function setupOpenApi(app: INestApplication): void {
  if (!shouldEnableOpenApi()) {
    return;
  }

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Holidays API')
      .setDescription('API para consultar feriados en Chile')
      .setVersion('1.0.0')
      .build()
  );

  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs-json'
  });
}

export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );

  setupOpenApi(app);

  return app;
}

export async function bootstrap(): Promise<INestApplication> {
  const app = await createApp();
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);

  await app.listen(port);

  return app;
}

if (require.main === module) {
  void bootstrap();
}
