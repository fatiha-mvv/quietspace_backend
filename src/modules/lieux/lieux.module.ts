import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LieuxController } from './lieux.controller';
import { LieuxService } from './lieux.service';
import { Lieu } from './entities/lieu.entity';
import { TypeLieu } from './entities/type-lieu.entity';
import { ElementBruit } from '../elements-bruit/entities/element-bruit.entity';
import { EnvBruitLieu } from './entities/env-bruit-lieu.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lieu, TypeLieu, ElementBruit, EnvBruitLieu]),
  ],
  controllers: [LieuxController],
  providers: [LieuxService],
  exports: [LieuxService],
})
export class LieuxModule {}