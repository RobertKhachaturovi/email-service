import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmailPreviewDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;
}
