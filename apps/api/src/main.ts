import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Strip unknown fields and reject invalid payloads before they reach any service
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('REST API for TaskFlow, a real-time project management app')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`API ready on http://localhost:${port} (docs at /docs)`, 'Bootstrap');
}

void bootstrap();
