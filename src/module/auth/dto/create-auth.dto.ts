
import { IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { genderEnum, roleEnum } from '../../../common/enums/user.enums.js';
export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
export class CreateAuthDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2,{message:'userName must be at least 2'})
    userName:string

    @IsEmail()
    email:string

    @IsString()
    @MinLength(6,{message:'password must be at least 6'})
    password:string

    @IsString()
    @IsPhoneNumber('EG')
    @IsOptional()
    phone?:string

    @IsEnum(genderEnum)
    @IsOptional()
    gender?:genderEnum

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAddressDto)
    @IsOptional()
    addresses?: CreateAddressDto[];
    }

export class loginDTO{
    @IsEmail()
    email:string

    @IsString()
    @MinLength(6,{message:'password must be at least 6'})
    password:string

    }
 export class verifyOtpDTO{
    @IsEmail()
    email:string

    @IsString()
    @MinLength(4,{message:'otp must be at least 4'})
    otp:string

    }