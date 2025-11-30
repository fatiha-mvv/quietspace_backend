import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('type_lieu')
export class TypeLieu {
  @PrimaryGeneratedColumn({ name: 'id_type_lieu' })
  idTypeLieu: number;

  @Column({ name: 'type_lieu', type: 'varchar', length: 50 })
  typeLieu: string;

  @Column({ name: 'base_score', type: 'int', nullable: true })
  baseScore: number;
}