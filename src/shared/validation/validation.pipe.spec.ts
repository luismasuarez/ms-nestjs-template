import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';

class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  role?: string;
}

describe('ValidationPipe (global settings)', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  it('transforms valid payloads into DTO instances', async () => {
    const result = await pipe.transform(
      { email: 'user@example.com', name: 'Test' },
      { metatype: CreateUserDto, type: 'body', data: '' },
    );

    expect(result).toBeInstanceOf(CreateUserDto);
    expect(result).toEqual({ email: 'user@example.com', name: 'Test' });
  });

  it('rejects non-whitelisted properties', async () => {
    await expect(
      pipe.transform(
        { email: 'user@example.com', name: 'Test', extra: 'nope' },
        { metatype: CreateUserDto, type: 'body', data: '' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid values', async () => {
    await expect(
      pipe.transform(
        { email: 'not-an-email', name: 'Test' },
        { metatype: CreateUserDto, type: 'body', data: '' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
