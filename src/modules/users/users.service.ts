import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { CreateUserDto } from '../../dto/users.dto';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { User } from '../../models/user.interface';

@Injectable()
export class UsersService {
  constructor(@Inject('PG_CONNECTION') private pool: Pool) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const saltRounds = 10;
    const { username, password } = createUserDto;
    if (!username || !password) {
      throw new BadRequestException('Please provide full data');
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
      const result = await this.pool.query(
        `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *`,
        [username, hashedPassword],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Database Error');
    }
  }

  async findPasswordUsername(username: string): Promise<User> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Database Error');
    }
  }
}
