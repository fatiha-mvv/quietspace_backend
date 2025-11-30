import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvisController } from './avis.controller';
import { AvisService } from './avis.service';
import { Avis } from './entities/avis.entity';
import { Lieu } from '../lieux/entities/lieu.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Avis, Lieu, User])],
  controllers: [AvisController],
  providers: [AvisService],
  exports: [AvisService],
})
export class AvisModule {}