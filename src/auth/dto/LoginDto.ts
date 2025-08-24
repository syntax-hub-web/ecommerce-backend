import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    MinLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiPropertyOptional({
        example: 'john.doe@example.com',
        description: 'Email address for login (optional if using phone)',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        example: '+201234567890',
        description: 'Phone number for login (optional if using email)',
    })
    @IsOptional()
    @IsPhoneNumber(null)
    phone?: string;

    @ApiProperty({
        example: 'securePass123',
        description: 'Password (minimum 6 characters)',
    })
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
