import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

 @Entity('type_elem_bruit')
 export class TypeElemBruit {
   @PrimaryGeneratedColumn()
   id_type_elem_bruit: number;
   
   @Column()
   type_elem_bruit: string;
   
   @Column('double precision')
   poids: number;
   
   @Column('double precision')
   d_half: number;
 }