import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Lieu } from './lieu.entity';

@Entity('type_lieu')
export class TypeLieu {
  @PrimaryGeneratedColumn({ 
    name: 'id_type_lieu',
    type: 'integer'
  })
  idTypeLieu: number;

  @Column({
    name: 'type_lieu',
    type: 'varchar',
    length: 50,
    nullable: true
  })
  typeLieu: string;

  @Column({
    name: 'base_score',
    type: 'integer',
    nullable: true
  })
  baseScore: number;

  @OneToMany(() => Lieu, (lieu) => lieu.typeLieu)
  lieux: Lieu[];
}