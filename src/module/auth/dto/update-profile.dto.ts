import { IsArray, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { genderEnum } from '../../../common/enums/user.enums.js';
import { CreateAddressDto } from './create-auth.dto.js';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2, { message: 'userName must be at least 2 characters' })
  @IsOptional()
  userName?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsPhoneNumber('EG')
  @IsOptional()
  phone?: string;

  @IsEnum(genderEnum)
  @IsOptional()
  gender?: genderEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  @IsOptional()
  address?: CreateAddressDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  @IsOptional()
  addresses?: CreateAddressDto[];
}
