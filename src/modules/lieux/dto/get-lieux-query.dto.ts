export class GetLieuxQueryDto {
  search?: string;
  types?: string; // comma-separated: "BIBLIOTHEQUE,CAFE"
  niveauCalme?: string; // TRES_CALME, CALME, ASSEZ_BRUYANT, TRES_BRUYANT
  latitude?: number;
  longitude?: number;
  distance?: number; // distance en mètres
  userId?: number; // pour récupérer les favoris
}