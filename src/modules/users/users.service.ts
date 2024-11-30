import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from '../../dto/users.dto';
import { Pool } from 'pg';

@Injectable()
export class UsersService {

  constructor(@Inject('PG_CONNECTION') private pool: Pool) {}

  async create(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto;

    try {
      const result = await this.pool.query(
        `INSERT INTO users (name, password) VALUES ($1, $2) RETURNING *`,
        [username, password],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Database Error');
    }
  }
}
