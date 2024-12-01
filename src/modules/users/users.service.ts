import {
  Inject,
  Injectable,
  InternalServerErrorException,
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
    const { name, password } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
      const result = await this.pool.query(
        `INSERT INTO users (name, password) VALUES ($1, $2) RETURNING *`,
        [name, hashedPassword],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Database Error');
    }
  }

  async findPasswordUsername(name: string): Promise<User> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE name = $1',
      [name],
    );
    return result.rows[0];
  }
}
