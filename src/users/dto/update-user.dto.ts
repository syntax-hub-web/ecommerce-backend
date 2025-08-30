import { PartialType } from '@nestjs/swagger';
import { CreateAuthDto } from 'src/auth/dto/create-auth.dto';

import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}
export class UpdateUserAndSellerDto extends PartialType(CreateAuthDto) { }  