import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Point } from 'geojson';
import { TypeElemBruit } from './type-elem-bruit.entity';

@Entity('element_bruit')
export class ElementBruit {
  @PrimaryGeneratedColumn({ name: 'id_elem_bruit' })
  idElemBruit: number;

  @Column({ name: 'nom_elem_bruit', type: 'varchar', length: 50, nullable: true })
  nomElemBruit: string;

  @Column({
    name: 'geom',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 32629,
  })
  geom: Point;

  @ManyToOne(() => TypeElemBruit, { eager: true })
  @JoinColumn({ name: 'id_type_elem_bruit' })
  typeElemBruit: TypeElemBruit;
}