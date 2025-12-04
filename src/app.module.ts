import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express'; 
import { memoryStorage } from 'multer'; 
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/entities/user.entity';
import { LieuxAdminModule } from './modules/lieuxAdmin/lieux.module';
import { LieuAdmin } from './modules/lieuxAdmin/entities/lieu.entity'; 
import { TypeLieu } from './modules/lieuxAdmin/entities/type-lieu.entity'; 
import { TypeElemBruit } from './modules/calme/entities/type-elem-bruit.entity'; 
import { CalmeModule } from './modules/calme/calme.module'; 
import { LieuxModule } from './modules/lieux/lieux.module'; 
import { Lieu } from './modules/lieux/entities/lieu.entity';
import { Avis } from './modules/avis/entities/avis.entity';           
import { Favoris } from './modules/favoris/entities/favoris.entity';
import { AvisModule } from './modules/avis/avis.module';
import { FavorisModule } from './modules/favoris/favoris.module';


@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Configuration TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
       
        entities: [User,
          Lieu, 
          LieuAdmin,
          TypeLieu, 
          Avis,     
          Favoris,  
          TypeElemBruit,
        ],
        synchronize: false, 
      }),
      inject: [ConfigService],
    }),
    
    // Configuration Multer globale pour l'upload de fichiers
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new Error('Type de fichier non autorisé. Seules les images sont acceptées.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
    
    // Modules de l'application
    AuthModule,
    UsersModule,
    CalmeModule,
    LieuxAdminModule,
    LieuxModule,
    AvisModule,
    FavorisModule,
  ],
})
export class AppModule {}