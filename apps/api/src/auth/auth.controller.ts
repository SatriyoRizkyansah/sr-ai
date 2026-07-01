import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LoggerService } from '../logger/logger.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: LoggerService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    this.logger.info('AUTH_REGISTER', `New user registration: ${dto.email}`, { name: dto.name });
    const result = await this.authService.register(dto);
    this.logger.info('AUTH_REGISTER', `User registered successfully: ${dto.email}`, { userId: result.user.id });
    return result;
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    this.logger.info('AUTH_LOGIN', `Login attempt: ${dto.email}`);
    const result = await this.authService.login(dto);
    this.logger.info('AUTH_LOGIN', `Login successful: ${dto.email}`, { userId: result.user.id });
    return result;
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    this.logger.debug('AUTH_REFRESH', `Token refresh request`);
    const result = await this.authService.refresh(dto.refreshToken);
    this.logger.debug('AUTH_REFRESH', `Token refreshed successfully`);
    return result;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser('id') userId: string) {
    this.logger.debug('AUTH_PROFILE', `Profile fetch for user ${userId}`);
    return this.authService.getProfile(userId);
  }
}
