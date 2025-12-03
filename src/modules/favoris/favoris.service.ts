import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favoris } from './entities/favoris.entity';
import { Lieu } from '../lieux/entities/lieu.entity';

@Injectable()
export class FavorisService {
  constructor(
    @InjectRepository(Favoris)
    private readonly favorisRepository: Repository<Favoris>,
    @InjectRepository(Lieu)
    private readonly lieuRepository: Repository<Lieu>,
  ) {}


  async addFavoris(userId: number, lieuId: number): Promise<{ message: string }> {
    // Vérifier que le lieu existe
    const lieu = await this.lieuRepository.findOne({
      where: { idLieu: lieuId },
    });

    if (!lieu) {
      throw new NotFoundException(`Lieu avec l'ID ${lieuId} non trouvé`);
    }

    // Vérifier si déjà en favoris
    const existing = await this.favorisRepository.findOne({
      where: { idUtilisateur: userId, idLieu: lieuId },
    });

    if (existing) {
      throw new ConflictException('Ce lieu est déjà dans vos favoris');
    }

    // Ajouter aux favoris
    const favoris = this.favorisRepository.create({
      idUtilisateur: userId,
      idLieu: lieuId,
      createdAtFavoris: new Date(),
    });

    await this.favorisRepository.save(favoris);

    return { message: 'Lieu ajouté aux favoris avec succès' };
  }

  async removeFavoris(userId: number, lieuId: number): Promise<{ message: string }> {
    const favoris = await this.favorisRepository.findOne({
      where: { idUtilisateur: userId, idLieu: lieuId },
    });

    if (!favoris) {
      throw new NotFoundException('Ce lieu n\'est pas dans vos favoris');
    }

    await this.favorisRepository.remove(favoris);

    return { message: 'Lieu retiré des favoris avec succès' };
  }


  async getFavorisByUser(userId: number) {
    return this.favorisRepository.find({
      where: { idUtilisateur: userId },
      relations: ['lieu', 'lieu.typeLieu'],
    });
  }
}