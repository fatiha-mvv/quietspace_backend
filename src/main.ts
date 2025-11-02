// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Active le CORS pour ton frontend
  app.enableCors({
    origin: ['http://localhost:3000'], // autorise ton frontend local
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // utile si tu utilises cookies ou headers d'auth
  });

  await app.listen(process.env.PORT ?? 3001); // port backend
}
bootstrap();
