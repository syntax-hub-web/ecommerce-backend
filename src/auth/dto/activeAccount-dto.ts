import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActiveAccountDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Activation token sent to the user email or phone',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}
