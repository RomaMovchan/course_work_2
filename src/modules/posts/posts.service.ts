import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { Post } from '../../models/posts.interface';
import { CreatePostDto } from '../../dto/posts.dto';
import { RedisCacheService } from '../../services/redis-cache.service';

const POST_REDIS_KEY = 'posts: all';
@Injectable()
export class PostsService {
  constructor(
    @Inject('PG_CONNECTION') private pool: Pool,
    private redisCacheService: RedisCacheService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const { content, title, user_id } = createPostDto;
    if (!content || !title || user_id === undefined) {
      throw new BadRequestException('Please provide full data');
    }
    try {
      const result = await this.pool.query(
        `INSERT INTO posts (content, title, user_id) VALUES ($1, $2, $3) RETURNING *`,
        [content, title, user_id],
      );

      const cachedPostsRedis: any = await this.redisCacheService.get(
        POST_REDIS_KEY,
      );
      const posts: Post[] = cachedPostsRedis
        ? JSON.parse(cachedPostsRedis)
        : [];
      posts.push(result.rows[0]);
      await this.redisCacheService.set(
        POST_REDIS_KEY,
        JSON.stringify(posts),
        3600,
      );
      return result.rows[0];
    } catch (error) {
      throw new InternalServerErrorException('Database Error');
    }
  }

  async getAllPosts(): Promise<Post[]> {
    const cachedPosts = await this.redisCacheService.get(POST_REDIS_KEY);
    if (cachedPosts) {
      return JSON.parse(cachedPosts as string);
    }
    try {
      const result = await this.pool.query(`SELECT * FROM posts`);
      return result.rows;
    } catch (error) {
      throw new InternalServerErrorException('Database Error');
    }
  }
}
