import { IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResendOTPDto {
    @ApiPropertyOptional({
        example: 'john.doe@example.com',
        description: 'Email address to resend the OTP (optional)',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        example: '+201234567890',
        description: 'Phone number to resend the OTP (optional)',
    })
    @IsOptional()
    @IsPhoneNumber(null)
    phone?: string;
}
