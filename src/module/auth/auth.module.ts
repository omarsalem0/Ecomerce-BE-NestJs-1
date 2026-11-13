import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { RedisService } from '../../common/service/redis/redis.service.js';
import { tokenModule } from '../../common/service/token/token.module.js';
import { UserModel } from '../../db/model/user.model.js';

@Module({
  imports:[tokenModule,UserModel],
  controllers: [AuthController],
  providers: [AuthService,RedisService],
})
export class AuthModule {}
