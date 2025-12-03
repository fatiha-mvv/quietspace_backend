import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalmeCalculatorService } from './calme-calculator.service';
import { TypeElemBruit } from './entities/type-elem-bruit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TypeElemBruit])
  ],
  providers: [CalmeCalculatorService],
  exports: [CalmeCalculatorService,TypeOrmModule] 
})
export class CalmeModule {}


