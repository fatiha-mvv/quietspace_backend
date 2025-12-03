import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TypeLieu } from './type-lieu.entity';

@Entity('lieu')
export class Lieu {
  @PrimaryColumn({
    name: 'id_lieu',
    type: 'integer'
  })
  idLieu: number;

  @ManyToOne(() => TypeLieu, (typeLieu) => typeLieu.lieux)
  @JoinColumn({ name: 'id_type_lieu' })
  typeLieu: TypeLieu;

  @Column({
    name: 'id_type_lieu',
    type: 'integer'
  })
  idTypeLieu: number;

  @Column({
    name: 'nom_lieu',
    type: 'char',
    length: 50,
    nullable: true
  })
  nomLieu: string;

  @Column({
    name: 'description_lieu',
    type: 'text',
    nullable: true
  })
  descriptionLieu: string;

  @Column({
    name: 'geom',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326, 
    nullable: true
  })
  geom: string;


  // @Column({
  //   name: 'score_calme',
  //   type: 'integer',
  //   nullable: true
  // })
  // scoreCalme: number;
  @Column({ 
  name: 'score_calme', 
  type: 'decimal', 
  precision: 5, 
  scale: 2,
  nullable: true 
})
scoreCalme: number | null;

  @Column({
    name: 'niveau_calme',
    type: 'varchar',
    length: 30,
    nullable: true
  })
  niveauCalme: string;

  @Column({
    name: 'adresse_lieu',
    type: 'text',
    nullable: true
  })
  adresseLieu: string;

  @Column({
    name: 'image_lieu',
    type: 'varchar',
    length: 256,
    nullable: true
  })
  imageLieu: string;

  @Column({
    name: 'created_at_lieu',
    type: 'date',
    nullable: true
  })
  createdAtLieu: Date;
}