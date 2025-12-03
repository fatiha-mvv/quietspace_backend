import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lieu } from '../../lieux/entities/lieu.entity';

@Entity('favoris')
export class Favoris {
  @PrimaryColumn({ name: 'id_utilisateur' })
  idUtilisateur: number;

  @PrimaryColumn({ name: 'id_lieu' })
  idLieu: number;

  @Column({ name: 'created_at_favoris', type: 'date', nullable: true })
  createdAtFavoris: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: User;

  @ManyToOne(() => Lieu, { eager: true })
  @JoinColumn({ name: 'id_lieu' })
  lieu: Lieu;
}