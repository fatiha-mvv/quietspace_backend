import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavorisController } from './favoris.controller';
import { FavorisService } from './favoris.service';
import { Favoris } from './entities/favoris.entity';
import { Lieu } from '../lieux/entities/lieu.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favoris, Lieu, User])],
  controllers: [FavorisController],
  providers: [FavorisService],
  exports: [FavorisService],
})
export class FavorisModule {}