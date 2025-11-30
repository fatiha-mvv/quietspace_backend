import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lieu } from './entities/lieu.entity';
import { TypeLieu } from './entities/type-lieu.entity';
import {GetLieuxQueryDto } from './dto/get-lieux-query.dto';
import { LieuResponseDto} from './dto/lieu-response.dto';
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
    const queryBuilder = this.lieuRepository
      .createQueryBuilder('lieu')
      .leftJoinAndSelect('lieu.typeLieu', 'typeLieu')
      .leftJoin('lieu.avis', 'avis')
      .leftJoin('lieu.favoris', 'favoris')
      .addSelect('AVG(avis.note)', 'noteMoyenne')
      .addSelect('COUNT(DISTINCT avis.idUtilisateur)', 'nombreAvis')
      .groupBy('lieu.idLieu')
      .addGroupBy('typeLieu.idTypeLieu');

    // Filtre par recherche
    if (query.search) {
      queryBuilder.andWhere('LOWER(lieu.nomLieu) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    // Filtre par types
    if (query.types) {
      const typesArray = query.types.split(',');
      queryBuilder.andWhere('typeLieu.typeLieu IN (:...types)', {
        types: typesArray,
      });
    }

    // Filtre par niveau de calme
    if (query.niveauCalme) {
      queryBuilder.andWhere('lieu.niveauCalme = :niveauCalme', {
        niveauCalme: query.niveauCalme,
      });
    }

    // Filtre par distance (si lat/lng fournis)
    if (query.latitude && query.longitude) {
      const userPoint = `ST_SetSRID(ST_MakePoint(${query.longitude}, ${query.latitude}), 32629)`;
      
      queryBuilder.addSelect(
        `ST_Distance(lieu.geom, ${userPoint})`,
        'distance'
      );

      if (query.distance) {
        queryBuilder.andWhere(
          `ST_DWithin(lieu.geom, ${userPoint}, :distance)`,
          { distance: query.distance }
        );
      }

      queryBuilder.orderBy('distance', 'ASC');
    } else {
      queryBuilder.orderBy('lieu.scoreCalme', 'DESC');
    }

    const lieux = await queryBuilder.getRawAndEntities();

    // Récupérer les favoris de l'utilisateur si userId fourni
    let favorisIds: number[] = [];
    if (userId) {
      const favoris = await this.lieuRepository
        .createQueryBuilder('lieu')
        .innerJoin('lieu.favoris', 'favoris')
        .where('favoris.idUtilisateur = :userId', { userId })
        .select('lieu.idLieu')
        .getRawMany();
      
      favorisIds = favoris.map((f) => f.lieu_id_lieu);
    }

    return lieux.entities.map((lieu, index) => {
      const raw = lieux.raw[index];
      const coords = this.parseGeometry(lieu.geom);
      
      return {
        id: lieu.idLieu,
        name: lieu.nomLieu,
        type: lieu.typeLieu.typeLieu,
        typeId: lieu.typeLieu.idTypeLieu,
        description: lieu.descriptionLieu,
        address: lieu.adresseLieu,
        lat: coords.lat,
        lng: coords.lng,
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
  }

  /**
   * Récupérer un lieu par ID
   */
  async getLieuById(id: number, userId?: number): Promise<LieuResponseDto> {
    const lieu = await this.lieuRepository
      .createQueryBuilder('lieu')
      .leftJoinAndSelect('lieu.typeLieu', 'typeLieu')
      .leftJoin('lieu.avis', 'avis')
      .addSelect('AVG(avis.note)', 'noteMoyenne')
      .addSelect('COUNT(DISTINCT avis.idUtilisateur)', 'nombreAvis')
      .where('lieu.idLieu = :id', { id })
      .groupBy('lieu.idLieu')
      .addGroupBy('typeLieu.idTypeLieu')
      .getRawAndEntities();

    if (!lieu.entities[0]) {
      throw new NotFoundException(`Lieu avec l'ID ${id} non trouvé`);
    }

    const lieuEntity = lieu.entities[0];
    const raw = lieu.raw[0];
    const coords = this.parseGeometry(lieuEntity.geom);

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

    return {
      id: lieuEntity.idLieu,
      name: lieuEntity.nomLieu,
      type: lieuEntity.typeLieu.typeLieu,
      typeId: lieuEntity.typeLieu.idTypeLieu,
      description: lieuEntity.descriptionLieu,
      address: lieuEntity.adresseLieu,
      lat: coords.lat,
      lng: coords.lng,
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
   * Parser la géométrie PostGIS
   */
  private parseGeometry(geom: any): { lat: number; lng: number } {
    if (typeof geom === 'string') {
      // Format: POINT(lng lat)
      const match = geom.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2]),
        };
      }
    } else if (geom && geom.coordinates) {
      // Format GeoJSON
      return {
        lng: geom.coordinates[0],
        lat: geom.coordinates[1],
      };
    }
    return { lat: 0, lng: 0 };
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