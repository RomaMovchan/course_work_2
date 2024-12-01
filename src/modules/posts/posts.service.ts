import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import { Post } from '../../models/posts.interface';
import { CreatePostDto } from '../../dto/posts.dto';

@Injectable()
export class PostsService {
  constructor(@Inject('PG_CONNECTION') private pool: Pool) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { content, title, user_id } = createPostDto;
    try {
      const result = await this.pool.query(
        `INSERT INTO posts (content, title, user_id) VALUES ($1, $2, $3) RETURNING *`,
        [content, title, user_id],
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Database Error');
    }
  }
}
