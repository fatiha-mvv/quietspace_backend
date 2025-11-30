import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avis } from './entities/avis.entity';
import { Lieu } from '../lieux/entities/lieu.entity';
import { CreateAvisDto, AvisResponseDto } from './dto/create-avis.dto';

@Injectable()
export class AvisService {
  constructor(
    @InjectRepository(Avis)
    private readonly avisRepository: Repository<Avis>,
    @InjectRepository(Lieu)
    private readonly lieuRepository: Repository<Lieu>,
  ) {}


  async createOrUpdateAvis(
    userId: number,
    lieuId: number,
    createAvisDto: CreateAvisDto,
  ): Promise<{ message: string; avis: AvisResponseDto }> {
    // Vérifier que le lieu existe
    const lieu = await this.lieuRepository.findOne({
      where: { idLieu: lieuId },
    });

    if (!lieu) {
      throw new NotFoundException(`Lieu avec l'ID ${lieuId} non trouvé`);
    }

    // Vérifier si un avis existe déjà
    let avis = await this.avisRepository.findOne({
      where: { idUtilisateur: userId, idLieu: lieuId },
    });

    if (avis) {
      // Mettre à jour l'avis existant
      avis.note = createAvisDto.note;
      await this.avisRepository.save(avis);
      
      return {
        message: 'Avis mis à jour avec succès',
        avis: {
          userId: avis.idUtilisateur,
          username: avis.utilisateur.username,
          lieuId: avis.idLieu,
          lieuName: lieu.nomLieu,
          note: avis.note,
        },
      };
    } else {
      // Créer un nouvel avis
      avis = this.avisRepository.create({
        idUtilisateur: userId,
        idLieu: lieuId,
        note: createAvisDto.note,
      });

      const savedAvis = await this.avisRepository.save(avis);
      
      // Recharger avec les relations
      const fullAvis = await this.avisRepository.findOne({
        where: { idUtilisateur: userId, idLieu: lieuId },
      });

      return {
        message: 'Avis créé avec succès',
        avis: {
          userId: fullAvis!.idUtilisateur,
          username: fullAvis!.utilisateur.username,
          lieuId: fullAvis!.idLieu,
          lieuName: lieu.nomLieu,
          note: fullAvis!.note,
        },
      };
    }
  }

  /**
   * Supprimer un avis
   */
  async deleteAvis(userId: number, lieuId: number): Promise<{ message: string }> {
    const avis = await this.avisRepository.findOne({
      where: { idUtilisateur: userId, idLieu: lieuId },
    });

    if (!avis) {
      throw new NotFoundException('Avis non trouvé');
    }

    await this.avisRepository.remove(avis);

    return { message: 'Avis supprimé avec succès' };
  }

  /**
   * Récupérer les avis d'un lieu
   */
  async getAvisByLieu(lieuId: number): Promise<AvisResponseDto[]> {
    const avis = await this.avisRepository.find({
      where: { idLieu: lieuId },
    });

    return avis.map((a) => ({
      userId: a.idUtilisateur,
      username: a.utilisateur.username,
      lieuId: a.idLieu,
      lieuName: '', // Sera rempli si nécessaire
      note: a.note,
    }));
  }

  /**
   * Récupérer les avis d'un utilisateur
   */
  async getAvisByUser(userId: number): Promise<AvisResponseDto[]> {
    const avis = await this.avisRepository.find({
      where: { idUtilisateur: userId },
      relations: ['lieu'],
    });

    return avis.map((a) => ({
      userId: a.idUtilisateur,
      username: a.utilisateur.username,
      lieuId: a.idLieu,
      lieuName: a.lieu.nomLieu,
      note: a.note,
    }));
  }
}