import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { TokensService } from './tokens.service';
import { Pool } from 'pg';
import { InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('@nestjs/jwt');
jest.mock('../../users/users.service');
jest.mock('./tokens.service');
jest.mock('pg');

describe('AuthService', () => {
  let authService: AuthService;
  let mockJwtService: JwtService;
  let mockUsersService: UsersService;
  let mockTokensService: TokensService;
  let mockPool: Pool;

  beforeEach(async () => {
    mockJwtService = new JwtService(null);
    mockUsersService = new UsersService(null);
    mockTokensService = new TokensService(null);
    mockPool = {
      query: jest.fn(),
    } as unknown as Pool;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: 'PG_CONNECTION', useValue: mockPool },
        { provide: TokensService, useValue: mockTokensService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('findTokenByUsername', () => {
    it('should return token information when found', async () => {
      const mockResult = {
        rows: [
          { access_token: 'some-token', refresh_token: 'some-refresh-token' },
        ],
      };
      mockPool.query['mockResolvedValue'](mockResult);

      const result = await authService.findTokenByUsername({
        username: 'testuser',
      });

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT * FROM users INNER JOIN tokens ON users.id = tokens.user_id WHERE users.username = $1`,
        ['testuser'],
      );
    });

    it('should throw InternalServerErrorException if there is a database error', async () => {
      mockPool.query['mockRejectedValue'](new Error('Database Error'));
      await expect(
        authService.findTokenByUsername({ username: 'testuser' }),
      ).rejects.toThrowError(
        new InternalServerErrorException('Database Error'),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if password matches', async () => {
      const user = { id: 1, username: 'testuser', password: 'hashedpassword' };
      mockUsersService.findPasswordUsername = jest.fn().mockResolvedValue(user);
      // @ts-ignore
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await authService.validateUser('testuser', 'password');

      expect(result).toEqual(user);
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
    });

    it('should return null if password does not match', async () => {
      const user = { id: 1, username: 'testuser', password: 'hashedpassword' };
      mockUsersService.findPasswordUsername = jest.fn().mockResolvedValue(user);
      // @ts-ignore
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const result = await authService.validateUser(
        'testuser',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockUsersService.findPasswordUsername = jest.fn().mockResolvedValue(null);

      const result = await authService.validateUser(
        'nonexistentuser',
        'password',
      );

      expect(result).toBeNull();
    });
  });

  describe('validateToken', () => {
    it('should return true if token is valid', () => {
      mockJwtService.verify = jest
        .fn()
        .mockReturnValue({ username: 'testuser', sub: 1 });

      const result = authService.validateToken('valid-token');

      expect(result).toBe(true);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('should return false if token is invalid', () => {
      mockJwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.validateToken('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens if no existing tokens', async () => {
      const user = { id: 1, username: 'testuser' };
      mockTokensService.findAccessTokenUserId = jest
        .fn()
        .mockResolvedValue(null);
      mockJwtService.sign = jest.fn().mockReturnValue('mock-token');
      mockTokensService.saveTokens = jest.fn();

      const result = await authService.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockTokensService.saveTokens).toHaveBeenCalledWith(
        user.id,
        'mock-token',
        'mock-token',
      );
    });

    it('should delete old tokens if they are invalid', async () => {
      const user = { id: 1, username: 'testuser' };
      const existingToken = {
        access_token: 'old-access-token',
        refresh_token: 'old-refresh-token',
      };
      mockTokensService.findAccessTokenUserId = jest
        .fn()
        .mockResolvedValue(existingToken);
      mockJwtService.verify = jest
        .fn()
        .mockReturnValue({ username: 'testuser', sub: 1 });
      mockTokensService.deleteAccessToken = jest.fn();
      mockTokensService.deleteRefreshToken = jest.fn();

      const result = await authService.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockTokensService.deleteAccessToken).toHaveBeenCalledWith(
        'old-access-token',
      );
      expect(mockTokensService.deleteRefreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new access token if refresh token is valid', async () => {
      const refreshToken = 'valid-refresh-token';
      const decoded = { username: 'testuser', sub: 1 };
      const user = { id: 1, username: 'testuser' };
      mockTokensService.findRefreshToken = jest
        .fn()
        .mockResolvedValue({ refresh_token: 'valid-refresh-token' });
      mockJwtService.verify = jest.fn().mockReturnValue(decoded);
      mockJwtService.sign = jest.fn().mockReturnValue('new-access-token');
      mockTokensService.saveTokens = jest.fn();

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('access_token', 'new-access-token');
      expect(mockTokensService.saveTokens).toHaveBeenCalledWith(
        decoded.sub,
        'new-access-token',
        refreshToken,
      );
    });

    it('should throw an error if refresh token is not valid', async () => {
      const refreshToken = 'invalid-refresh-token';
      mockTokensService.findRefreshToken = jest.fn().mockResolvedValue(null);

      await expect(
        authService.refreshAccessToken(refreshToken),
      ).rejects.toThrowError('Refresh token not found');
    });

    it('should throw an error if refresh token verification fails', async () => {
      const refreshToken = 'invalid-refresh-token';
      mockTokensService.findRefreshToken = jest
        .fn()
        .mockResolvedValue({ refresh_token: 'invalid-refresh-token' });
      mockJwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      await expect(
        authService.refreshAccessToken(refreshToken),
      ).rejects.toThrowError('Invalid or expired refresh token');
    });
  });

  describe('logout', () => {
    it('should delete access token', async () => {
      const accessToken = 'some-access-token';
      mockTokensService.deleteAccessToken = jest.fn();

      await authService.logout(accessToken);

      expect(mockTokensService.deleteAccessToken).toHaveBeenCalledWith(
        accessToken,
      );
    });
  });
});
