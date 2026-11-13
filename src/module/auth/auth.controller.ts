import { Body, Controller, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateAuthDto, loginDTO, verifyOtpDTO } from './dto/create-auth.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AuthGuard } from '../../common/auth/auth.guard.js';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(201)
  signUp(@Body() body: CreateAuthDto) {
    return this.authService.signup(body);
  }

  @Post('verify-account')
  @HttpCode(200)
  verify(@Body() body: verifyOtpDTO) {
    return this.authService.verifyAccount(body);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: loginDTO) {
    return this.authService.login(body);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  @HttpCode(200)
  updateProfile(@Req() req: Request & { user: any }, @Body() body: UpdateProfileDto) {
    const userId = (req.user as any)?.id;
    return this.authService.updateProfile(userId, body);
  }
}
