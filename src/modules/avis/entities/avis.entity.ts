import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lieu } from '../../lieux/entities/lieu.entity';

@Entity('avis')
export class Avis {
  @PrimaryColumn({ name: 'id_utilisateur' })
  idUtilisateur: number;

  @PrimaryColumn({ name: 'id_lieu' })
  idLieu: number;

  @Column({ name: 'note', type: 'int', nullable: true })
  note: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: User;

  @ManyToOne(() => Lieu)
  @JoinColumn({ name: 'id_lieu' })
  lieu: Lieu;
}