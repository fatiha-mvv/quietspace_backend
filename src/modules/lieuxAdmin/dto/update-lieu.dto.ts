import { PartialType } from '@nestjs/mapped-types';
import { CreateLieuDto } from './create-lieu.dto';
import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';

export class UpdateLieuDto extends PartialType(CreateLieuDto) {
  @IsInt()
  @IsOptional()
  idTypeLieu?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  scoreCalme?: number;

  @IsString()
  @IsOptional()
  niveauCalme?: string;
}
