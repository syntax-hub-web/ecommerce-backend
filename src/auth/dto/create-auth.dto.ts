import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuthDto {
    @ApiProperty({ example: 'John', description: 'First name of the user' })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe', description: 'Last name of the user' })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '+201234567890', description: 'Phone number with country code' })
    @IsNotEmpty()
    @IsPhoneNumber(null)
    phone: string;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        description: 'Avatar image file (optional)',
    })
    @IsOptional()
    avatar?: any; // keep type `any` so file interceptor accepts it

    @ApiProperty({ example: 'securePass123', description: 'Password (min 6 characters)' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({ example: 'seller', description: 'Role ID of the user' })
    @IsOptional()
    role_id: string;

    @ApiPropertyOptional({ example: 'SyntaxHub', description: 'Brand name (for sellers)' })
    @IsOptional()
    @IsString()
    brand_name?: string;

    @ApiPropertyOptional({ example: 'We provide tech solutions', description: 'Brand description (for sellers)' })
    @IsOptional()
    @IsString()
    brand_description?: string;
}
