import { RedisService } from './../../common/service/redis/redis.service.js';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuthDto, loginDTO, verifyOtpDTO } from './dto/create-auth.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { User } from '../../db/model/user.model.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { sendEmail } from '../../common/utils/sendemail.js';
import { verifyData } from '../../common/security/hashdata.js';
import { TokenService } from '../../common/service/token/token.service.js';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) readonly  _userModel:Model<User>,
   private  readonly RedisService:RedisService,
   private  readonly tokenService:TokenService,
){

  }
  async signup(data: CreateAuthDto) {
        if(!data) { 
       throw new BadRequestException('no data send or data not complete')}
        const {userName,email,password}=data
        const exsistUser =await this._userModel.findOne({email})
        if (exsistUser) {
            throw new ConflictException("user already exsist")
        }
        let otp = Math.floor(1000 + Math.random() * 9000);

        let addedUser =await this._userModel.insertOne({userName,email,password,confirmEmail:false})

        if (!addedUser) {
            throw new BadRequestException('user not added')
        }
        await this.RedisService.set({
        key:`otp:${addedUser._id}`,
        value:otp,
        ttl:60*5
    })
    await sendEmail({
        to:email,
        subject:'<h1> verfiy your account </h1>',
        html:`<h2>the otp is ${otp}</h2>`
    })
    return addedUser 
   
  }
   async login (data:loginDTO){
        if(!data) {
       throw new BadRequestException('no data send or data not complete')}
     let {email,password}=data
     let exsistUser = await this._userModel.findOne({email,confirmEmail:true})
     if (!exsistUser) {
        throw new NotFoundException('email dosnot exsist or not active')
     }
     let verifyPassword =await verifyData(password,exsistUser.password)     
     if (!verifyPassword) {
        throw new BadRequestException('invild password')
     }
     let {accessToken,refreshToken}=await this.tokenService.generateToken(exsistUser)     
     return {accessToken,refreshToken}

    }
     async verifyAccount(data:verifyOtpDTO){
        let{email,otp}=data
        let exsistUser=await this._userModel.findOne({email,confirmEmail:false})
        if (!exsistUser) {
            throw new NotFoundException('email dosnot exsist')
        }
        let Otp =await this.RedisService.get(`otp:${exsistUser._id}`) 
        if (!Otp) {
            throw new NotFoundException('OTP expired or not found')
        }
      else{
          if (Otp!=otp) {
            throw new BadRequestException("otp dosnot matched")
            
          }else{
         exsistUser.confirmEmail=true
          await this.RedisService.del(`otp:${exsistUser._id}`) 
         await exsistUser.save()
         return {
            message :'user is verified successfuly',
            exsistUser
         }
          }
      }
    }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    if (!userId) {
      throw new BadRequestException('user ID is required');
    }

    const user = await this._userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('user is not found');
    }

    if (data.userName) {
      user.userName = data.userName;
    }
    if (data.firstName) {
      user.firstName = data.firstName;
    }
    if (data.lastName) {
      user.lastName = data.lastName;
    }
    if (data.phone !== undefined) {
      user.phone = data.phone;
    }
    if (data.gender !== undefined) {
      user.gender = data.gender;
    }
    const newAddresses = data.address ?? data.addresses;
    if (newAddresses !== undefined) {
      user.address = newAddresses as any;
    }

    await user.save();

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete (userObj as any).password;
    return {
      message: 'profile updated successfully',
      user: userObj,
    };
  }
}
