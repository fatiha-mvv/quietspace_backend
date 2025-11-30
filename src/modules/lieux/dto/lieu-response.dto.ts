export class LieuResponseDto {
  id: number;
  name: string;
  type: string;
  typeId: number;
  description: string;
  address: string;
  lat: number;
  lng: number;
  scoreCalme: number;
  niveauCalme: string;
  image: string;
  distance?: number;
  isFavorite?: boolean;
  noteMoyenne?: number | null;
  nombreAvis?: number;
  createdAt: Date;
}