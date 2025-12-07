import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { CreateFeedbackDto } from './create-feedback.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
  
  const feedback = new Feedback();
  feedback.message = createFeedbackDto.message;
  feedback.name = createFeedbackDto.name ?? null;
  feedback.email = createFeedbackDto.email ?? null;

  
  if (createFeedbackDto.userId) {
    const user = await this.userRepository.findOneBy({ id: createFeedbackDto.userId });
    if (user) {
      feedback.user = user;
    } else {
      feedback.user = null; // fallback if user not found
    }
  } else {
    feedback.user = null;
  }
  

  return this.feedbackRepository.save(feedback);
}



  // Lister tous les feedbacks (admin)
  async findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find({ relations: ['user'] });
  }

  // Trouver un feedback par id
  async findOne(id: number): Promise<Feedback| null> {
    return this.feedbackRepository.findOne({ where: { id }, relations: ['user'] });
  }

  // Supprimer un feedback
  async remove(id: number): Promise<void> {
    await this.feedbackRepository.delete(id);
  }
}
