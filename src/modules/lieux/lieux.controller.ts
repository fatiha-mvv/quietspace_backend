import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Request,
 
} from '@nestjs/common';
import { LieuxService } from './lieux.service';
import { GetLieuxQueryDto } from './dto/get-lieux-query.dto';

@Controller('lieux')
export class LieuxController {
  

  constructor(private readonly lieuxService: LieuxService) {}

  /**
   * GET /lieux/types
   * Récupérer tous les types de lieux disponibles
   */
  @Get('types')
  async getTypesLieux() {
   
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
    return this.lieuxService.getLieux(query, userId);
  }

}