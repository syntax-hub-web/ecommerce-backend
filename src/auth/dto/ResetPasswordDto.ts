import {
    IsEmail,
    IsMobilePhone,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({
        example: '123456',
        description: 'One-time password (OTP) sent to email or phone',
    })
    @IsString()
    @IsNotEmpty()
    otp: string;

    @ApiPropertyOptional({
        example: 'john.doe@example.com',
        description: 'Email address linked to the account',
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({
        example: '+201234567890',
        description: 'Mobile phone number linked to the account',
    })
    @IsString()
    @IsOptional()
    @IsMobilePhone()
    phone?: string;

    @ApiProperty({
        example: 'StrongPass123!',
        description: 'New password (minimum 8 characters)',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}
