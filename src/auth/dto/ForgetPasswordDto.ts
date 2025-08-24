import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForgetPasswordDto {
    @ApiPropertyOptional({
        example: 'john.doe@example.com',
        description: 'User email address (optional)',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        example: '+201234567890',
        description: 'User phone number with country code (optional)',
    })
    @IsOptional()
    @IsPhoneNumber(null)
    phone?: string;
}
