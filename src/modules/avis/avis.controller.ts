import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AvisService } from './avis.service';
import { CreateAvisDto } from './dto/create-avis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard) // Protect all routes with JWT
@Controller('avis')
export class AvisController {
  constructor(private readonly avisService: AvisService) {}

  @Post('lieu/:lieuId')
  async createAvis(
    @Param('lieuId', ParseIntPipe) lieuId: number,
    @Body() createAvisDto: CreateAvisDto,
    @Request() req: any,
  ) {
   const userId = req.user.userId;
    return this.avisService.createOrUpdateAvis(userId, lieuId, createAvisDto);
  }

  @Get('lieu/:lieuId')
  async getAvisByLieu(@Param('lieuId', ParseIntPipe) lieuId: number) {
    return this.avisService.getAvisByLieu(lieuId);
  }

  @Get('user')
  async getAvisByUser(@Request() req: any) {
    const userId = req.user.userId;
    return this.avisService.getAvisByUser(userId);
  }

  @Delete('lieu/:lieuId')
  async deleteAvis(
    @Param('lieuId', ParseIntPipe) lieuId: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.avisService.deleteAvis(userId, lieuId);
  }
}