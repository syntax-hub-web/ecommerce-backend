import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyOTPDto {
    @ApiPropertyOptional({
        example: 'john.doe@example.com',
        description: 'Email address associated with the OTP (optional)',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        example: '+201234567890',
        description: 'Phone number associated with the OTP (optional)',
    })
    @IsOptional()
    @IsPhoneNumber(null)
    phone?: string;

    @ApiProperty({
        example: '123456',
        description: 'One-time password (OTP) to verify',
    })
    @IsNotEmpty()
    otp: string;
}
