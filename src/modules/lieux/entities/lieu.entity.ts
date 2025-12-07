import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import type { Point } from 'geojson';

import { TypeLieu } from '../../lieuxAdmin/entities/type-lieu.entity';
import { Avis } from '../../avis/entities/avis.entity';
import { Favoris } from '../../favoris/entities/favoris.entity';

@Entity('lieu')
export class Lieu {
  @PrimaryGeneratedColumn({ name: 'id_lieu' })
  idLieu: number;

  @Column({ name: 'nom_lieu', type: 'varchar', length: 50 })
  nomLieu: string;

  @Column({ name: 'description_lieu', type: 'text', nullable: true })
  descriptionLieu: string;

  @Column({
    name: 'geom',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  geom: Point;

  @Column({ name: 'score_calme', type: 'int', nullable: true })
  scoreCalme: number;

  @Column({ name: 'niveau_calme', type: 'varchar', length: 30, nullable: true })
  niveauCalme: string;

  @Column({ name: 'adresse_lieu', type: 'text', nullable: true })
  adresseLieu: string;

  @Column({ name: 'image_lieu', type: 'varchar', length: 256, nullable: true })
  imageLieu: string;

  @Column({ name: 'created_at_lieu', type: 'date', nullable: true })
  createdAtLieu: Date;

  // Relations
  @ManyToOne(() => TypeLieu, { eager: true })
  @JoinColumn({ name: 'id_type_lieu' })
  typeLieu: TypeLieu;

  @OneToMany(() => Avis, (avis) => avis.lieu)
  avis: Avis[];

  @OneToMany(() => Favoris, (favoris) => favoris.lieu)
  favoris: Favoris[];

 
}