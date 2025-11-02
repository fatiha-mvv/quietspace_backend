import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: 'Veuillez fournir un email valide' })
  email: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  password: string;
}