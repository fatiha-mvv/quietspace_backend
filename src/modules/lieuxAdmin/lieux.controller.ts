import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseIntPipe,
  ParseFloatPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LieuxService } from './lieux.service';
import { CreateLieuDto } from '../lieuxAdmin/dto/create-lieu.dto';
import { UpdateLieuDto } from '../lieuxAdmin/dto/update-lieu.dto';
import { LieuAdmin } from '../lieuxAdmin/entities/lieu.entity';
import { TypeLieu } from '../lieuxAdmin/entities/type-lieu.entity';

@Controller('lieuxAdmin')
export class LieuxController {
  constructor(private readonly lieuxService: LieuxService) {}

  // 1. UPLOAD D'IMAGE (doit être en premier car commence par 'upload')
  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    
    const result = await this.lieuxService.uploadImage(file);
    
    // Retourner le format attendu par le frontend
    return {
      url: result.url,
      filename: result.filename
    };
  }

  // 2. ROUTES POUR LES TYPES DE LIEUX (avant les routes :id)
  @Get('types/all')
  async findAllTypes(): Promise<TypeLieu[]> {
    return await this.lieuxService.findAllTypes();
  }

  @Get('types/:id')
  async findOneType(@Param('id', ParseIntPipe) id: number): Promise<TypeLieu> {
    return await this.lieuxService.findOneType(id);
  }


  // 3. ROUTE DE RECHERCHE PAR TYPE (avant les routes :id)
  @Get('type/:idTypeLieu')
  async findByType(
    @Param('idTypeLieu', ParseIntPipe) idTypeLieu: number,
  ): Promise<LieuAdmin[]> {
    return await this.lieuxService.findByType(idTypeLieu);
  }
  // CREATE - Créer un nouveau lieu
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createLieuDto: CreateLieuDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<LieuAdmin> {
    return await this.lieuxService.createWithImage(createLieuDto, imageFile);
  }

  // READ ALL - Récupérer tous les lieux
  @Get()
  async findAll(): Promise<LieuAdmin[]> {
    return await this.lieuxService.findAll();
  }

  // READ ONE - Récupérer un lieu par son ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LieuAdmin> {
    return await this.lieuxService.findOne(id);
  }

  // UPDATE - Mettre à jour un lieu
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLieuDto: UpdateLieuDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<LieuAdmin> {
    return await this.lieuxService.updateWithImage(id, updateLieuDto, imageFile);
  }

  // DELETE - Supprimer un lieu
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.lieuxService.remove(id);
  }
}