import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lieu } from './entities/lieu.entity';
import { TypeLieu } from '../lieuxAdmin/entities/type-lieu.entity';
import { GetLieuxQueryDto } from './dto/get-lieux-query.dto';
import { LieuResponseDto } from './dto/lieu-response.dto';
import { TypeLieuResponseDto } from './dto/type-lieu-response.dto';

@Injectable()
export class LieuxService {
  

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
    console.log('\n========== RÉCUPÉRATION DES LIEUX ==========');
    console.log(`Paramètres: ${JSON.stringify(query)}`);

    const queryBuilder = this.lieuRepository
      .createQueryBuilder('lieu')
      .leftJoinAndSelect('lieu.typeLieu', 'typeLieu')
      .leftJoin('lieu.avis', 'avis')
      .leftJoin('lieu.favoris', 'favoris')
      .addSelect('AVG(avis.note)', 'noteMoyenne')
      .addSelect('COUNT(DISTINCT avis.idUtilisateur)', 'nombreAvis')
      // Extraire les coordonnées 
      .addSelect('ST_Y(ST_Transform(lieu.geom, 4326))', 'latitude')
      .addSelect('ST_X(ST_Transform(lieu.geom, 4326))', 'longitude')
      .groupBy('lieu.idLieu')
      .addGroupBy('typeLieu.idTypeLieu');

    // Filtre par recherche
    if (query.search) {
      console.log(`Filtre recherche: "${query.search}"`);
      queryBuilder.andWhere('LOWER(lieu.nomLieu) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    // Filtre par types
    if (query.types) {
      const typesArray = query.types.split(',');
      console.log(`Filtre types: ${typesArray.join(', ')}`);
      queryBuilder.andWhere('typeLieu.typeLieu IN (:...types)', {
        types: typesArray,
      });
    }

    // Filtre par niveau de calme
    if (query.niveauCalme) {
      console.log(`Filtre niveau de calme: ${query.niveauCalme}`);
      queryBuilder.andWhere('lieu.niveauCalme = :niveauCalme', {
        niveauCalme: query.niveauCalme,
      });
    }

    //  Filtre par distance (si lat/lng fournis)
    if (query.latitude !== undefined && query.longitude !== undefined) {
      console.log(`Position utilisateur: (${query.latitude}, ${query.longitude})`);
      console.log(`Distance maximale: ${query.distance ? query.distance + 'm' : 'Aucune limite'}`);

      // Créer le point utilisateur en WGS84 (SRID 4326)
      const userPoint = `ST_SetSRID(ST_MakePoint(${query.longitude}, ${query.latitude}), 4326)`;
      
      // Pour calculer la distance en MÈTRES on transforme  en systeme projete pour le calcul
      const userPointUTM = `ST_Transform(${userPoint}, 32629)`;
      const lieuGeomUTM = `ST_Transform(lieu.geom, 32629)`;
      
      // Calculer la distance en mètres 
      queryBuilder.addSelect(
        `ST_Distance(${lieuGeomUTM}, ${userPointUTM})`,
        'distance'
      );

      // Filtrer par distance maximale si spécifiée
      if (query.distance) {
        // On utilise ST_DWithin avec les deux géométries transformées en UTM
        queryBuilder.andWhere(
          `ST_DWithin(${lieuGeomUTM}, ${userPointUTM}, :distance)`,
          { distance: query.distance }
        );
        console.log(`Filtre appliqué: lieux dans un rayon de ${query.distance}m`);
      }

      // Trier par distance (le plus proche en premier)
      queryBuilder.orderBy('distance', 'ASC');
      console.log('Tri: par distance croissante');
    } else {
      // Pas de position, trier par score de calme
      console.log('Tri: par score de calme décroissant');
      queryBuilder.orderBy('lieu.scoreCalme', 'DESC');
    }

    const lieux = await queryBuilder.getRawAndEntities();
    console.log(`=> ${lieux.entities.length} lieux trouvés\n`);

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
      console.log(` ${favorisIds.length} favoris pour l'utilisateur ${userId}\n`);
    }

    const results = lieux.entities.map((lieu, index) => {
      const raw = lieux.raw[index];
      
      // Extraire les coordonnées WGS84
      const lat = parseFloat(raw.latitude);
      const lng = parseFloat(raw.longitude);
      
      if (raw.distance !== undefined) {
        console.log(
          `  ${lieu.nomLieu.padEnd(30)} | ` +
          `Distance: ${Math.round(raw.distance).toString().padStart(5)}m | ` +
          `Score: ${lieu.scoreCalme}/100 | ` +
          `Coords: (${lat.toFixed(6)}, ${lng.toFixed(6)})`
        );
      }
      
      return {
        id: lieu.idLieu,
        name: lieu.nomLieu,
        type: lieu.typeLieu.typeLieu,
        typeId: lieu.typeLieu.idTypeLieu,
        description: lieu.descriptionLieu,
        address: lieu.adresseLieu,
        lat: lat,
        lng: lng,
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

    console.log('========== FIN RÉCUPÉRATION ==========\n');
    return results;
  }

  /**
   * Récupérer un lieu par ID
   */
  async getLieuById(id: number, userId?: number): Promise<LieuResponseDto> {
    console.log(`\nRécupération du lieu ID: ${id}`);

    const lieu = await this.lieuRepository
      .createQueryBuilder('lieu')
      .leftJoinAndSelect('lieu.typeLieu', 'typeLieu')
      .leftJoin('lieu.avis', 'avis')
      .addSelect('AVG(avis.note)', 'noteMoyenne')
      .addSelect('COUNT(DISTINCT avis.idUtilisateur)', 'nombreAvis')
      .addSelect('ST_Y(ST_Transform(lieu.geom, 4326))', 'latitude')
      .addSelect('ST_X(ST_Transform(lieu.geom, 4326))', 'longitude')
      .where('lieu.idLieu = :id', { id })
      .groupBy('lieu.idLieu')
      .addGroupBy('typeLieu.idTypeLieu')
      .getRawAndEntities();

    if (!lieu.entities[0]) {
      console.log(` Lieu avec l'ID ${id} non trouvé\n`);
      throw new NotFoundException(`Lieu avec l'ID ${id} non trouvé`);
    }

    const lieuEntity = lieu.entities[0];
    const raw = lieu.raw[0];
    
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

    console.log(`Lieu trouvé: ${lieuEntity.nomLieu}`);
    console.log(`   Score: ${lieuEntity.scoreCalme}/100`);
    console.log(`   Position WGS84: (${lat.toFixed(6)}, ${lng.toFixed(6)})\n`);

    return {
      id: lieuEntity.idLieu,
      name: lieuEntity.nomLieu,
      type: lieuEntity.typeLieu.typeLieu,
      typeId: lieuEntity.typeLieu.idTypeLieu,
      description: lieuEntity.descriptionLieu,
      address: lieuEntity.adresseLieu,
      lat: lat,
      lng: lng,
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