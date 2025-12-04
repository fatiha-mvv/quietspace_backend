import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Request,
  Logger,
} from '@nestjs/common';
import { LieuxService } from './lieux.service';
import { GetLieuxQueryDto } from './dto/get-lieux-query.dto';

@Controller('lieux')
export class LieuxController {
  private readonly logger = new Logger(LieuxController.name);

  constructor(private readonly lieuxService: LieuxService) {}

  /**
   * GET /lieux/types
   * Récupérer tous les types de lieux disponibles
   */
  @Get('types')
  async getTypesLieux() {
    this.logger.log('Requête GET /lieux/types');
    return this.lieuxService.getTypesLieux();
  }

  /**
   * GET /lieux/:id
   * Récupérer un lieu spécifique par son ID
   */
  @Get(':id')
  async getLieuById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    this.logger.log(`Requête GET /lieux/${id} - User: ${userId || 'Non authentifié'}`);
    return this.lieuxService.getLieuById(id, userId);
  }

  /**
   * GET /lieux
   * Récupérer tous les lieux avec filtres optionnels
   * 
   * Query params:
   * - search: Recherche par nom
   * - types: Filtrer par types (séparés par virgules)
   * - niveauCalme: Filtrer par niveau de calme
   * - latitude: Position de l'utilisateur (WGS84)
   * - longitude: Position de l'utilisateur (WGS84)
   * - distance: Distance maximale en mètres
   */
  @Get()
  async getLieux(
    @Query() query: GetLieuxQueryDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    
    // 🔍 LOG: Vérifier TOUS les paramètres reçus
    this.logger.log('========================================');
    this.logger.log('Requête GET /lieux');
    this.logger.log('========================================');
    this.logger.log(`User ID: ${userId || 'Non authentifié'}`);
    this.logger.log(`Recherche: ${query.search || 'Aucune'}`);
    this.logger.log(`Types: ${query.types || 'Tous'}`);
    this.logger.log(`Niveau calme: ${query.niveauCalme || 'Tous'}`);
    
    // ⭐ CRITIQUE: Vérifier la position utilisateur
    if (query.latitude !== undefined && query.longitude !== undefined) {
      this.logger.log(`--Position utilisateur:`);
      this.logger.log(`   - Latitude: ${query.latitude}°`);
      this.logger.log(`   - Longitude: ${query.longitude}°`);
      this.logger.log(`   - Distance max: ${query.distance || 'Illimitée'} mètres`);
      
      // Vérifier si les coordonnées sont valides
      if (this.isValidCoordinate(query.latitude, query.longitude)) {
        this.logger.log(`===>Coordonnées valides`);
      } else {
        this.logger.warn(`===>Coordonnées invalides !`);
      }
    } else {
      this.logger.warn(`==>Aucune position utilisateur fournie`);
      if (query.latitude === undefined) {
        this.logger.warn(`   - Latitude manquante`);
      }
      if (query.longitude === undefined) {
        this.logger.warn(`   - Longitude manquante`);
      }
    }
    
    this.logger.log('========================================');

    return this.lieuxService.getLieux(query, userId);
  }

  /**
   * Valider les coordonnées géographiques
   */
  private isValidCoordinate(lat: number, lon: number): boolean {
    // Latitude: -90 à 90
    // Longitude: -180 à 180
    // Pour le Maroc: lat ~28-36, lon ~-17 à -1
    const isLatValid = lat >= -90 && lat <= 90;
    const isLonValid = lon >= -180 && lon <= 180;
    
    // Vérification spécifique pour le Maroc
    const isMorocco = lat >= 27 && lat <= 36 && lon >= -17 && lon <= -1;
    
    if (!isLatValid || !isLonValid) {
      this.logger.error(`Coordonnées hors limites: lat=${lat}, lon=${lon}`);
      return false;
    }
    
    if (!isMorocco) {
      this.logger.warn(`Coordonnées en dehors du Maroc: lat=${lat}, lon=${lon}`);
    }
    
    return isLatValid && isLonValid;
  }
}