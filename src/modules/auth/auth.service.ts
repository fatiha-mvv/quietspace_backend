import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur avec le rôle "user" par défaut
    const user = this.usersRepository.create({
      username: name,
      email,
      password: hashedPassword,
      role: Role.USER,
    });

    const savedUser = await this.usersRepository.save(user);

    // Générer le token JWT
    const payload = { 
      sub: savedUser.id, 
      email: savedUser.email, 
      role: savedUser.role 
    };
    
    const access_token = this.jwtService.sign(payload);

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.usersRepository.findOne({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const access_token = this.jwtService.sign(payload);

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: userId } });
  }
}