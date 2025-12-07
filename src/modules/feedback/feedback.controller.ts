import { Controller, Post, Body, Get, Param, Delete, BadRequestException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { Feedback } from './feedback.entity';
import { CreateFeedbackDto } from './create-feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Créer un feedback
  // @Post()
  // async create(@Body() feedbackData: Partial<Feedback>): Promise<Feedback> {
  //   return this.feedbackService.create(feedbackData);
  // }

  @Post()
async create(@Body() feedbackData: CreateFeedbackDto) {
  if (!feedbackData.message || !feedbackData.message.trim()) {
    throw new BadRequestException('Message is required');
  }

  return this.feedbackService.create(feedbackData);
}



  // Récupérer tous les feedbacks
  @Get()
  async findAll(): Promise<Feedback[]> {
    return this.feedbackService.findAll();
  }

  // Récupérer un feedback par id
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Feedback| null> {
    return this.feedbackService.findOne(id);
  }

  // Supprimer un feedback
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.feedbackService.remove(id);
  }
}
