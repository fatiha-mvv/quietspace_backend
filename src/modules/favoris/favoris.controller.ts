import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavorisService } from './favoris.service';

@Controller('favoris')
// @UseGuards(JwtAuthGuard) // Décommenter quand l'auth est en place
export class FavorisController {
  constructor(private readonly favorisService: FavorisService) {}


  @Get()
  async getFavoris(@Request() req: any) {
    const userId = req.user?.id || 1; // Mock userId pour tests
    return this.favorisService.getFavorisByUser(userId);
  }

  @Post(':lieuId')
  async addFavoris(
    @Param('lieuId', ParseIntPipe) lieuId: number,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.favorisService.addFavoris(userId, lieuId);
  }

  @Delete(':lieuId')
  async removeFavoris(
    @Param('lieuId', ParseIntPipe) lieuId: number,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.favorisService.removeFavoris(userId, lieuId);
  }
}