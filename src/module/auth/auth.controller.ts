import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateAuthDto, loginDTO, verifyOtpDTO } from './dto/create-auth.dto.js';


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

}
