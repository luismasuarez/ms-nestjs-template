import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

export class UserDto {
  @IsString()
  id: string;

  @IsString()
  role: string;

  @IsString()
  organization: string;

  @IsString()
  church: string;
}

export class PayloadDto<T = unknown> {
  @ValidateNested({ each: true })
  @Type(() => Object) // O especifica la clase concreta si T es conocido, ej. @Type(() => CategoryDto)
  data: T;

  @ValidateNested()
  @Type(() => UserDto) // Obligatorio para transformar el objeto plano a UserDto
  user: UserDto;
}
