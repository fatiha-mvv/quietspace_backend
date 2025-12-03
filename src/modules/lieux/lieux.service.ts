import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lieu } from './entities/lieu.entity';
import { TypeLieu } from './entities/type-lieu.entity';
import { GetLieuxQueryDto } from './dto/get-lieux-query.dto';
import { LieuResponseDto } from './dto/lieu-response.dto';
import { TypeLieuResponseDto } from './dto/type-lieu-response.dto';

@Injectable()
export class LieuxService {
  private readonly logger = new Logger(LieuxService.name);

  constructor(
    @InjectRepository(Lieu)
    private readonly lieuRepository: Repository<Lieu>,
    @InjectRepository(TypeLieu)
    private readonly typeLieuRepository: Repository<TypeLieu>,
  ) {}

  /**
   * Récupérer tous les types de lieux
   */
  async getTypesLieux(): Promise<TypeLieuResponseDto[]> {
    const types = await this.typeLieuRepository.find();
    
    return types.map((type) => ({
      value: type.typeLieu,
      label: this.formatTypeLieuLabel(type.typeLieu),
      baseScore: type.baseScore,
    }));
  }

  /**
   * Récupérer tous les lieux avec filtres
   */
  async getLieux(query: GetLieuxQueryDto, userId?: number): Promise<LieuResponseDto[]> {
    this.logger.log(`=== RÉCUPÉRATION DES LIEUX ===`);
    this.logger.log(`Paramètres: ${JSON.stringify(query)}`);
    this.logger.log(`User ID: ${userId || 'Non authentifié'}`);

    const queryBuilder = this.lieuRepository
      .createQueryBuilder('lieu')
      .leftJoinAndSelect('lieu.typeLieu', 'typeLieu')
      .leftJoin('lieu.avis', 'avis')
      .leftJoin('lieu.favoris', 'favoris')
      .addSelect('AVG(avis.note)', 'noteMoyenne')
      .addSelect('COUNT(DISTINCT avis.idUtilisateur)', 'nombreAvis')
      // 🔥 CORRECTION CRITIQUE: Ajouter les coordonnées WGS84 dans le SELECT
      .addSelect('ST_Y(ST_Transform(lieu.geom, 4326))', 'latitude')
      .addSelect('ST_X(ST_Transform(lieu.geom, 4326))', 'longitude')
      .groupBy('lieu.idLieu')
      .addGroupBy('typeLieu.idTypeLieu');

    // Filtre par recherche
    if (query.search) {
      this.logger.log(`Filtre recherche: ${query.search}`);
      queryBuilder.andWhere('LOWER(lieu.nomLieu) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    // Filtre par types
    if (query.types) {
      const typesArray = query.types.split(',');
      this.logger.log(`Filtre types: ${typesArray.join(', ')}`);
      queryBuilder.andWhere('typeLieu.typeLieu IN (:...types)', {
        types: typesArray,
      });
    }

    // Filtre par niveau de calme
    if (query.niveauCalme) {
      this.logger.log(`Filtre niveau de calme: ${query.niveauCalme}`);
      queryBuilder.andWhere('lieu.niveauCalme = :niveauCalme', {
        niveauCalme: query.niveauCalme,
      });
    }

    // 🌍 Filtre par distance (si lat/lng fournis)
    if (query.latitude !== undefined && query.longitude !== undefined) {
      this.logger.log(`Position utilisateur: (${query.latitude}, ${query.longitude})`);
      this.logger.log(`Distance maximale: ${query.distance || 'Aucune limite'} mètres`);

      // ✅ CORRECTION: Convertir WGS84 (SRID 4326) en UTM 29N (SRID 32629)
      const userPointWGS84 = `ST_SetSRID(ST_MakePoint(${query.longitude}, ${query.latitude}), 4326)`;
      const userPointUTM = `ST_Transform(${userPointWGS84}, 32629)`;
      
      // Calculer la distance en mètres
      queryBuilder.addSelect(
        `ST_Distance(lieu.geom, ${userPointUTM})`,
        'distance'
      );

      // Filtrer par distance maximale si spécifiée
      if (query.distance) {
        queryBuilder.andWhere(
          `ST_DWithin(lieu.geom, ${userPointUTM}, :distance)`,
          { distance: query.distance }
        );
        this.logger.log(`Filtre: lieux dans un rayon de ${query.distance}m`);
      }

      // Trier par distance (le plus proche en premier)
      queryBuilder.orderBy('distance', 'ASC');
    } else {
      // Pas de position, trier par score de calme
      this.logger.log('Aucune position, tri par score de calme');
      queryBuilder.orderBy('lieu.scoreCalme', 'DESC');
    }

    const lieux = await queryBuilder.getRawAndEntities();
    this.logger.log(`${lieux.entities.length} lieux trouvés`);

    // Récupérer les favoris de l'utilisateur
    let favorisIds: number[] = [];
    if (userId) {
      const favoris = await this.lieuRepository
        .createQueryBuilder('lieu')
        .innerJoin('lieu.favoris', 'favoris')
        .where('favoris.idUtilisateur = :userId', { userId })
        .select('lieu.idLieu')
        .getRawMany();
      
      favorisIds = favoris.map((f) => f.lieu_id_lieu);
      this.logger.log(`${favorisIds.length} favoris pour l'utilisateur ${userId}`);
    }

    const results = lieux.entities.map((lieu, index) => {
      const raw = lieux.raw[index];
      
      // 🔥 CORRECTION: Utiliser les coordonnées WGS84 du SELECT directement
      const lat = parseFloat(raw.latitude);
      const lng = parseFloat(raw.longitude);
      
      if (raw.distance !== undefined) {
        this.logger.debug(
          `Lieu: ${lieu.nomLieu} - Distance: ${Math.round(raw.distance)}m - ` +
          `Position WGS84: (${lat.toFixed(6)}, ${lng.toFixed(6)})`
        );
      }
      
      return {
        id: lieu.idLieu,
        name: lieu.nomLieu,
        type: lieu.typeLieu.typeLieu,
        typeId: lieu.typeLieu.idTypeLieu,
        description: lieu.descriptionLieu,
        address: lieu.adresseLieu,
        lat: lat,  // 🔥 Coordonnées WGS84 directes
        lng: lng,  // 🔥 Coordonnées WGS84 directes
        scoreCalme: lieu.scoreCalme,
        niveauCalme: lieu.niveauCalme,
        image: lieu.imageLieu,
        distance: raw.distance ? Math.round(raw.distance) : undefined,
        isFavorite: favorisIds.includes(lieu.idLieu),
        noteMoyenne: raw.noteMoyenne ? parseFloat(raw.noteMoyenne) : null,
        nombreAvis: raw.nombreAvis ? parseInt(raw.nombreAvis) : 0,
        createdAt: lieu.createdAtLieu,
      };
    });

    this.logger.log(`=== FIN RÉCUPÉRATION DES LIEUX ===`);
    return results;
  }

  /**
   * Récupérer un lieu par ID
   */
  async getLieuById(id: number, userId?: number): Promise<LieuResponseDto> {
    this.logger.log(`Récupération du lieu ID: ${id}`);

    const lieu = await this.lieuRepository
      .createQueryBuilder('lieu')
      .leftJoinAndSelect('lieu.typeLieu', 'typeLieu')
      .leftJoin('lieu.avis', 'avis')
      .addSelect('AVG(avis.note)', 'noteMoyenne')
      .addSelect('COUNT(DISTINCT avis.idUtilisateur)', 'nombreAvis')
      // 🔥 CORRECTION: Ajouter les coordonnées WGS84
      .addSelect('ST_Y(ST_Transform(lieu.geom, 4326))', 'latitude')
      .addSelect('ST_X(ST_Transform(lieu.geom, 4326))', 'longitude')
      .where('lieu.idLieu = :id', { id })
      .groupBy('lieu.idLieu')
      .addGroupBy('typeLieu.idTypeLieu')
      .getRawAndEntities();

    if (!lieu.entities[0]) {
      this.logger.warn(`Lieu avec l'ID ${id} non trouvé`);
      throw new NotFoundException(`Lieu avec l'ID ${id} non trouvé`);
    }

    const lieuEntity = lieu.entities[0];
    const raw = lieu.raw[0];
    
    // 🔥 Utiliser les coordonnées WGS84 du SELECT
    const lat = parseFloat(raw.latitude);
    const lng = parseFloat(raw.longitude);

    // Vérifier si c'est un favori
    let isFavorite = false;
    if (userId) {
      const favoris = await this.lieuRepository
        .createQueryBuilder('lieu')
        .innerJoin('lieu.favoris', 'favoris')
        .where('lieu.idLieu = :id', { id })
        .andWhere('favoris.idUtilisateur = :userId', { userId })
        .getCount();
      
      isFavorite = favoris > 0;
    }

    this.logger.log(
      `Lieu: ${lieuEntity.nomLieu} - Score: ${lieuEntity.scoreCalme} - ` +
      `Position WGS84: (${lat.toFixed(6)}, ${lng.toFixed(6)})`
    );

    return {
      id: lieuEntity.idLieu,
      name: lieuEntity.nomLieu,
      type: lieuEntity.typeLieu.typeLieu,
      typeId: lieuEntity.typeLieu.idTypeLieu,
      description: lieuEntity.descriptionLieu,
      address: lieuEntity.adresseLieu,
      lat: lat,  // 🔥 WGS84
      lng: lng,  // 🔥 WGS84
      scoreCalme: lieuEntity.scoreCalme,
      niveauCalme: lieuEntity.niveauCalme,
      image: lieuEntity.imageLieu,
      isFavorite,
      noteMoyenne: raw.noteMoyenne ? parseFloat(raw.noteMoyenne) : null,
      nombreAvis: raw.nombreAvis ? parseInt(raw.nombreAvis) : 0,
      createdAt: lieuEntity.createdAtLieu,
    };
  }

  /**
   * Formater le label d'un type de lieu
   */
  private formatTypeLieuLabel(type: string): string {
    const labels = {
      BIBLIOTHEQUE: 'Bibliothèque',
      CAFE: 'Café',
      COWORKING: 'Coworking',
      SALLE_ETUDE: "Salle d'étude",
    };
    return labels[type] || type;
  }
}