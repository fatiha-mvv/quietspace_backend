import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LieuxController } from './lieux.controller';
import { LieuxService } from './lieux.service';
import { Lieu } from './entities/lieu.entity';
import { TypeLieu } from '../lieuxAdmin/entities/type-lieu.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lieu, TypeLieu]),
  ],
  controllers: [LieuxController],
  providers: [LieuxService],
  exports: [LieuxService],
})
export class LieuxModule {}