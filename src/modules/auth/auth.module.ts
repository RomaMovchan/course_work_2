import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DbModule } from '../../system-modules/dbo.module';
import { AuthService } from './services/auth.service';
import { TokensService } from './services/tokens.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DbModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService, AuthGuard],
  exports: [TokensService],
})
export class AuthModule {}
