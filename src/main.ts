import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Active le CORS pour ton frontend
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  //Servir les fichiers statiques (images)
  // Utilisation de 'any' pour contourner le problème de type
  (app as any).useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  await app.listen(process.env.PORT ?? 3001);
  
  console.log(`🚀 Backend démarré sur http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`🖼️  Images accessibles via http://localhost:${process.env.PORT ?? 3001}/images/lieux/`);
}
bootstrap();