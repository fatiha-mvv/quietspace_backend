import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('type_elem_bruit')
export class TypeElemBruit {
  @PrimaryGeneratedColumn({ name: 'id_type_elem_bruit' })
  idTypeElemBruit: number;

  @Column({ name: 'type_elem_bruit', type: 'varchar', length: 50 })
  typeElemBruit: string;

  @Column({ name: 'poids', type: 'float', nullable: true })
  poids: number;

  @Column({ name: 'd_half', type: 'float', nullable: true })
  dHalf: number;
}