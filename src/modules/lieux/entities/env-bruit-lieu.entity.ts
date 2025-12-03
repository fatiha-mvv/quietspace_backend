import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lieu } from '../../lieux/entities/lieu.entity';
import { ElementBruit } from '../../elements-bruit/entities/element-bruit.entity';

@Entity('env_bruit_lieu')
export class EnvBruitLieu {
  @PrimaryColumn({ name: 'id_lieu' })
  idLieu: number;

  @PrimaryColumn({ name: 'id_elem_bruit' })
  idElemBruit: number;

  @ManyToOne(() => Lieu)
  @JoinColumn({ name: 'id_lieu' })
  lieu: Lieu;

  @ManyToOne(() => ElementBruit)
  @JoinColumn({ name: 'id_elem_bruit' })
  elementBruit: ElementBruit;
}
