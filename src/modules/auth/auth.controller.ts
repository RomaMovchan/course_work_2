import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { name: string; password: string }) {
    const user = await this.authService.validateUser(
      body.name,
      body.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.authService.login(user);
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
