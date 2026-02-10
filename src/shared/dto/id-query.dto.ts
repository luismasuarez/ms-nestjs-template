import { IsString, IsUUID } from 'class-validator';

export class IdQueryDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsString()
  createdBy: string;
}
