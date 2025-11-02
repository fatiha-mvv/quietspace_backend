import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Le nom complet est requis' })
  @IsString()
  @MaxLength(30, { message: 'Le nom ne peut pas dépasser 30 caractères' })
  name: string;

  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: 'Veuillez fournir un email valide' })
  email: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;
}