export class CreateFeedbackDto {
  userId?: number | null;   
  name?: string | null;     
  email?: string | null;    
  message: string;          
}
