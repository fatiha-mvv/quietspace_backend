import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Le nom ne peut pas dépasser 30 caractères' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Veuillez fournir un email valide' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}