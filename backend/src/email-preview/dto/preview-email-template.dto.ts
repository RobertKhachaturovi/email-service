import { IsNotEmpty, IsString } from 'class-validator';

export class PreviewEmailTemplateDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;
}
