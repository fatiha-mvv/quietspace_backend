import { IsInt, Min, Max } from 'class-validator';

export class CreateAvisDto {
  @IsInt()
  @Min(1)
  @Max(5)
  note: number;
}

export class AvisResponseDto {
  userId: number;
  username: string;
  lieuId: number;
  lieuName: string;
  note: number;
}