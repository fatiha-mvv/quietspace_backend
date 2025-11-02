import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../../common/enums/role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.USER },
      select: ['id', 'username', 'email', 'role', 'avatar', 'createdAt'],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, role: Role.USER },
      select: ['id', 'username', 'email', 'role', 'avatar', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, ...userData } = createUserDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = this.usersRepository.create({
      ...userData,
      email,
      password: hashedPassword,
      role: Role.USER,
    });

    const savedUser = await this.usersRepository.save(user);

    // Retourner sans le mot de passe
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });
      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async getProfile(userId: number): Promise<User> {
    return this.findOne(userId);
  }
}