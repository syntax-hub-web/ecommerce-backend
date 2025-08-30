import { IsOptional, IsString } from 'class-validator';

export class UpdateSellerDto {
    @IsOptional()
    @IsString()
    brand_name?: string;

    @IsOptional()
    @IsString()
    brand_description?: string;
}