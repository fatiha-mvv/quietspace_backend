export class LieuResponseDto {
  idLieu: number;
  idTypeLieu: number;
  typeLieu?: string;
  nomLieu?: string;
  descriptionLieu?: string;
  geom?: string;
  scoreCalme?: number;
  niveauCalme?: string;
  adresseLieu?: string;
  imageLieu?: string;
  createdAtLieu?: Date;
}