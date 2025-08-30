import { IsOptional, ValidateNested } from "class-validator";
import { UpdateSellerDto } from "./seller.dto";
import { UpdateUserDto } from "./update-user.dto";
import { Type } from "class-transformer";

export class UpdateUserAndSellerDto {
    @ValidateNested()
    @Type(() => UpdateUserDto)
    @IsOptional()
    user?: UpdateUserDto;

    @ValidateNested()
    @Type(() => UpdateSellerDto)
    @IsOptional()
    seller?: UpdateSellerDto;
}
