import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const { username, password } = body;
    if (!username || !password) {
      throw new BadRequestException('Please provide full data');
    }
    const user = await this.authService.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.authService.login(user);
  }

  @Get('get-token/:username')
  async findTokenByUsername(@Param() username: any) {
    return this.authService.findTokenByUsername(username);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    const token = await this.authService.refreshAccessToken(body.refresh_token);

    if (!token) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return token;
  }
}
