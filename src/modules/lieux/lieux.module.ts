import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { LieuxService } from './lieux.service';
import { LieuxController } from './lieux.controller';
import { Lieu } from './entities/lieu.entity';
import { TypeLieu } from './entities/type-lieu.entity';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lieu, TypeLieu]),
    // Configuration de Multer pour utiliser la mémoire
    // Les fichiers seront gérés manuellement dans le service
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, callback) => {
        // Vérifier le type de fichier
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new Error('Seules les images sont autorisées'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  ],
  controllers: [LieuxController],
  providers: [LieuxService],
  exports: [LieuxService],
})
export class LieuxModule {}