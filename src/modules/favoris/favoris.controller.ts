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
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard) // Protect all routes with JWT
@Controller('favoris')
export class FavorisController {
  constructor(private readonly favorisService: FavorisService) {}

  // Get all favorites of the logged-in user
  @Get()
  async getFavoris(@Request() req: any) {
    const userId = req.user.userId; 
    return this.favorisService.getFavorisByUser(userId);
  }


  // Add a favorite for the logged-in user
  @Post(':lieuId')
  async addFavoris(
    @Param('lieuId', ParseIntPipe) lieuId: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId; 
    return this.favorisService.addFavoris(userId, lieuId);
  }

  // Remove a favorite for the logged-in user
  @Delete(':lieuId')
  async removeFavoris(
    @Param('lieuId', ParseIntPipe) lieuId: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId; 
    return this.favorisService.removeFavoris(userId, lieuId);
  }
}

