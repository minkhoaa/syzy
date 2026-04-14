import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnv } from './common/config/env';

async function bootstrap() {
  const env = validateEnv();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [env.WAITLIST_APP_ORIGIN, 'http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Syzy Waitlist API')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(env.PORT);
  console.log(`Syzy waitlist backend running on port ${env.PORT}`);
}

void bootstrap();
