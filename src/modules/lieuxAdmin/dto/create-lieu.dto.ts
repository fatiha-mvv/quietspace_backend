import { 
  IsInt, 
  IsString, 
  IsOptional, 
  IsDateString
} from 'class-validator';

export class CreateLieuDto {
  @IsInt()
  idTypeLieu: number;

  @IsString()
  @IsOptional()
  nomLieu?: string;

  @IsString()
  @IsOptional()
  descriptionLieu?: string;

  @IsString()
  @IsOptional()
  geom?: string; // Format: 'POINT(longitude latitude)'

  @IsString()
  @IsOptional()
  adresseLieu?: string;

  @IsString()
  @IsOptional()
  imageLieu?: string;

  @IsDateString()
  @IsOptional()
  createdAtLieu?: Date;
}