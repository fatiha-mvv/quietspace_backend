import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lieu } from './entities/lieu.entity';
import { TypeLieu } from './entities/type-lieu.entity';
import { CreateLieuDto } from './dto/create-lieu.dto';
import { UpdateLieuDto } from './dto/update-lieu.dto';
import * as fs from 'fs';
import * as path from 'path';
import { CalmeCalculatorService } from '../calme/calme-calculator.service';

@Injectable()
export class LieuxService {
  constructor(
    @InjectRepository(Lieu)
    private readonly lieuRepository: Repository<Lieu>,
    @InjectRepository(TypeLieu)
    private readonly typeLieuRepository: Repository<TypeLieu>,

     private readonly calmeCalculator: CalmeCalculatorService
  ) {}

  // Configuration pour le stockage des images
  private readonly uploadPath = path.join(process.cwd(), 'public', 'images', 'lieux');
  private readonly baseImageUrl = 'images/lieux'; // Sans le slash initial

 


  

  async findAll(): Promise<Lieu[]> {
    return await this.lieuRepository.find({
      relations: ['typeLieu'],
      order: { idLieu: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Lieu> {
    const lieu = await this.lieuRepository.findOne({
      where: { idLieu: id },
      relations: ['typeLieu']
    });

    if (!lieu) {
      throw new NotFoundException(`Lieu avec l'ID ${id} non trouvé`);
    }

    return lieu;
  }

 

  async remove(id: number): Promise<void> {
    const lieu = await this.findOne(id);
    
    // Supprimer l'image associée si elle existe
    if (lieu.imageLieu) {
      await this.deleteImageFile(lieu.imageLieu);
    }
    
    await this.lieuRepository.remove(lieu);
  }

  // Méthode pour uploader une image
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé. Seules les images sont acceptées.');
    }

    // Vérifier la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Fichier trop volumineux. Taille maximale: 5MB');
    }

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.originalname);
    const fileName = `lieu-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const filePath = path.join(this.uploadPath, fileName);

    try {
      // Sauvegarder le fichier
      fs.writeFileSync(filePath, file.buffer);
      
      // Retourner le chemin d'accès public (sans le slash initial)
      const publicImagePath = `${this.baseImageUrl}/${fileName}`;
      
      console.log('Image uploadée avec succès:', publicImagePath);
      
      return { 
        url: publicImagePath,
        filename: fileName 
      };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du fichier:', error);
      throw new BadRequestException('Erreur lors de la sauvegarde du fichier');
    }
  }

  // Méthode pour supprimer un fichier image
  private async deleteImageFile(imagePath: string): Promise<void> {
    try {
      if (!imagePath) return;
      
      // Extraire le nom du fichier du chemin
      // imagePath peut être "images/lieux/fichier.jpg" ou juste "fichier.jpg"
      const fileName = path.basename(imagePath);
      const filePath = path.join(this.uploadPath, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Image supprimée avec succès:', filePath);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier image:', error);
      // Ne pas throw l'erreur pour ne pas bloquer la suppression du lieu
    }
  }
  
  //helper
private extractCoordinates(geom: string) {
  if (!geom) {
    throw new BadRequestException("Geom est requis.");
  }

  const match = geom.match(/POINT\(([^ ]+) ([^ ]+)\)/);

  if (!match) {
    throw new BadRequestException(
      "Format geom invalide. Format attendu: POINT(lon lat)"
    );
  }

  return {
    longitude: parseFloat(match[1]),
    latitude: parseFloat(match[2])
  };
}



  // Méthode pour créer un lieu avec upload d'image
  async createWithImage(createLieuDto: CreateLieuDto, imageFile?: Express.Multer.File): Promise<Lieu> {
    let imagePath = createLieuDto.imageLieu;

    // Uploader la nouvelle image si fournie
    if (imageFile) {
      const uploadResult = await this.uploadImage(imageFile);
      imagePath = uploadResult.url;
    }

    // Vérifier si le type de lieu existe
    const typeLieu = await this.typeLieuRepository.findOne({
      where: { idTypeLieu: createLieuDto.idTypeLieu }
    });

    if (!typeLieu) {
      throw new NotFoundException(`Type de lieu avec l'ID ${createLieuDto.idTypeLieu} non trouvé`);
    }
    // DEBUG: Afficher le geom reçu
  console.log('Geom reçu:', createLieuDto.geom);
  console.log('Données complètes reçues:', createLieuDto);

    // Calculer automatiquement le score de calme et le niveau
    // const scoreCalme = this.calculerScoreCalme(createLieuDto.idTypeLieu);
    // const niveauCalme = this.calculerNiveauCalme(scoreCalme);
    //calcule de niveau de calme --DEBUT
    // extraire latitude et longitude depuis le geom
    if (!createLieuDto.geom) {
        throw new BadRequestException("geom est requis pour calculer le score.");
      }
    const coords = this.extractCoordinates(createLieuDto.geom);

    // score de base selon type de lieu
    const baseScore = this.calmeCalculator.getScoreBase(createLieuDto.idTypeLieu);

    // calcul via Overpass
    const calmeData = await this.calmeCalculator.calculateScoreCalme(
      coords.latitude,
      coords.longitude,
      baseScore
    );

    const scoreCalme = calmeData.scoreFinal;
    const niveauCalme = calmeData.niveauCalme;

    //calcule de niveau de calme --FIN

     // Utiliser Query Builder pour l'insertion spatiale
  const result = await this.lieuRepository
    .createQueryBuilder()
    .insert()
    .into(Lieu)
    .values({
      ...createLieuDto,
      imageLieu: imagePath,
      scoreCalme,
      niveauCalme,
      geom: () => `ST_GeomFromText('${createLieuDto.geom}', 4326)`
    })
    .returning('*')
    .execute();

  const savedLieu = result.raw[0];
  
  // Recharger avec les relations
  return await this.findOne(savedLieu.id_lieu);
    // const lieu = this.lieuRepository.create({
    //   ...createLieuDto,
    //   imageLieu: imagePath,
    //   scoreCalme, // Toujours défini
    //   niveauCalme // Toujours défini
    // });

    // const savedLieu = await this.lieuRepository.save(lieu);
    
    // // Recharger avec les relations
    // return await this.findOne(savedLieu.idLieu);
  }

  // Méthode pour mettre à jour un lieu avec upload d'image
 async updateWithImage(id: number, updateLieuDto: UpdateLieuDto, imageFile?: Express.Multer.File): Promise<Lieu> {
  const lieu = await this.findOne(id);

  // Uploader la nouvelle image si fournie
  if (imageFile) {
    // Supprimer l'ancienne image si elle existe
    if (lieu.imageLieu) {
      await this.deleteImageFile(lieu.imageLieu);
    }

    const uploadResult = await this.uploadImage(imageFile);
    updateLieuDto.imageLieu = uploadResult.url;
  }

  // Vérifier si le type de lieu existe si on veut le modifier
  if (updateLieuDto.idTypeLieu) {
    const typeLieu = await this.typeLieuRepository.findOne({
      where: { idTypeLieu: updateLieuDto.idTypeLieu }
    });

    if (!typeLieu) {
      throw new NotFoundException(`Type de lieu avec l'ID ${updateLieuDto.idTypeLieu} non trouvé`);
    }

    // Si le type de lieu change, recalculer le score et le niveau
    // const nouveauScoreCalme = this.calculerScoreCalme(updateLieuDto.idTypeLieu);
    // const nouveauNiveauCalme = this.calculerNiveauCalme(nouveauScoreCalme);
    //calculer score --DEBUT
   const coords = this.extractCoordinates(updateLieuDto.geom ?? lieu.geom);

    const baseScore = this.calmeCalculator.getScoreBase(
      updateLieuDto.idTypeLieu ?? lieu.idTypeLieu
    );

    const calmeData = await this.calmeCalculator.calculateScoreCalme(
      coords.latitude,
      coords.longitude,
      baseScore
    );

    updateLieuDto.scoreCalme = calmeData.scoreFinal;
    updateLieuDto.niveauCalme = calmeData.niveauCalme;

    //calculer score --FIN
    
   
  }

  // Si le geom est modifié, utiliser le bon SRID
  if (updateLieuDto.geom) {
    await this.lieuRepository
      .createQueryBuilder()
      .update(Lieu)
      .set({
        ...updateLieuDto,
        geom: () => `ST_GeomFromText('${updateLieuDto.geom}', 4326)` 
      })
      .where('id_lieu = :id', { id })
      .execute();

    return await this.findOne(id);
  } else {
    Object.assign(lieu, updateLieuDto);
    return await this.lieuRepository.save(lieu);
  }
}

  // Méthodes spécifiques pour les opérations spatiales
  async findNearby(latitude: number, longitude: number, radius: number): Promise<Lieu[]> {
    return await this.lieuRepository
      .createQueryBuilder('lieu')
      .leftJoinAndSelect('lieu.typeLieu', 'typeLieu')
      .where(
        `ST_DWithin(
          lieu.geom, 
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 32629), 
          :radius
        )`,
        { longitude, latitude, radius }
      )
      .orderBy('ST_Distance(lieu.geom, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 32629))')
      .getMany();
  }

  async findByType(idTypeLieu: number): Promise<Lieu[]> {
    return await this.lieuRepository.find({
      where: { idTypeLieu },
      relations: ['typeLieu'],
      order: { idLieu: 'ASC' }
    });
  }

  // Gestion des types de lieux
  async findAllTypes(): Promise<TypeLieu[]> {
    return await this.typeLieuRepository.find({
      order: { idTypeLieu: 'ASC' }
    });
  }

  async findOneType(id: number): Promise<TypeLieu> {
    const typeLieu = await this.typeLieuRepository.findOne({
      where: { idTypeLieu: id }
    });

    if (!typeLieu) {
      throw new NotFoundException(`Type de lieu avec l'ID ${id} non trouvé`);
    }

    return typeLieu;
  }
}