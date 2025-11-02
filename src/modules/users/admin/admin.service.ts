import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Role } from '../../../common/enums/role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.ADMIN },
      select: ['id', 'username', 'email', 'role', 'avatar', 'createdAt'],
    });
  }

  async findOne(id: number): Promise<User> {
    const admin = await this.usersRepository.findOne({
      where: { id, role: Role.ADMIN },
      select: ['id', 'username', 'email', 'role', 'avatar', 'createdAt'],
    });

    if (!admin) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    return admin;
  }

  async create(createAdminDto: CreateAdminDto): Promise<User> {
    const { email, password, ...adminData } = createAdminDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'administrateur
    const admin = this.usersRepository.create({
      ...adminData,
      email,
      password: hashedPassword,
      role: Role.ADMIN,
    });

    const savedAdmin = await this.usersRepository.save(admin);

    // Retourner sans le mot de passe
    const { password: _, ...adminWithoutPassword } = savedAdmin;
    return adminWithoutPassword as User;
  }

  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<User> {
    const admin = await this.findOne(id);

    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: updateAdminDto.email } 
      });
      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    await this.usersRepository.update(id, updateAdminDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const admin = await this.findOne(id);
    await this.usersRepository.remove(admin);
  }

  // Méthodes spécifiques aux admins
  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'email', 'role', 'avatar', 'createdAt'],
    });
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    await this.usersRepository.remove(user);
  }
}