import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  @MaxLength(30, { message: 'Le nom ne peut pas dépasser 30 caractères' })
  username: string;

  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: 'Veuillez fournir un email valide' })
  email: string;

  @IsNotEmpty({ message: "La ville est requise" })
  @IsString({ message: 'La ville doit être une chaîne de caractères' })  // ✅ CORRECTION ICI
  ville: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}