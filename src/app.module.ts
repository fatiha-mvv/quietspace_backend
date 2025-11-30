import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/entities/user.entity';
import { LieuxModule } from './modules/lieux/lieux.module'; 
import { Lieu } from './modules/lieux/entities/lieu.entity';
import { TypeLieu } from './modules/lieux/entities/type-lieu.entity'; 
import { Avis } from './modules/avis/entities/avis.entity';           
import { Favoris } from './modules/favoris/entities/favoris.entity';
import { ElementBruit } from './modules/elements-bruit/entities/element-bruit.entity'; 
import { TypeElemBruit } from './modules/elements-bruit/entities/type-elem-bruit.entity';
import { AvisModule } from './modules/avis/avis.module';
import { FavorisModule } from './modules/favoris/favoris.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
          TypeLieu, 
          Avis,     
          Favoris,  
          ElementBruit,
          TypeElemBruit,
        ],
        synchronize: false, 
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    LieuxModule,
    AvisModule,
    FavorisModule,
  ],
})
export class AppModule {}
