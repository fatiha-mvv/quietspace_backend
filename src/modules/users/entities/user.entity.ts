import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';

@Entity('utilisateur')  // ← tout en minuscules
export class User {
  @PrimaryGeneratedColumn({ name: 'id_utilisateur' })
  id: number;

  @Column({ name: 'username', type: 'char', length: 30, nullable: true })
  username: string;

  @Column({ name: 'email', type: 'varchar', length: 320, nullable: true, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 256, nullable: true })
  password: string;

  @Column({ 
    name: 'role', 
    type: 'varchar', 
    length: 30, 
    nullable: true, 
    default: Role.USER 
  })
  role: Role;

  @Column({ name: 'avatar', type: 'varchar', length: 256, nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at_utilisateur', type: 'date' })
  createdAt: Date;
}
