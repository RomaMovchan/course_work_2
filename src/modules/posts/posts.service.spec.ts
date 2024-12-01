import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { RedisCacheService } from '../../services/redis-cache.service';
import { Pool } from 'pg';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

const mockPool = {
  query: jest.fn(),
};

const mockRedisCacheService = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('PostsService', () => {
  let postsService: PostsService;
  let redisCacheService: RedisCacheService;
  let pool: Pool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: 'PG_CONNECTION', useValue: mockPool },
        { provide: RedisCacheService, useValue: mockRedisCacheService },
      ],
    }).compile();

    postsService = module.get<PostsService>(PostsService);
    redisCacheService = module.get<RedisCacheService>(RedisCacheService);
    pool = module.get<Pool>('PG_CONNECTION');
  });

  describe('create', () => {
    it('should throw BadRequestException if required fields are missing', async () => {
      const createPostDto = { content: '', title: '', user_id: undefined };

      await expect(postsService.create(createPostDto)).rejects.toThrow(
        new BadRequestException('Please provide full data'),
      );
    });

    it('should insert a new post and return the post object', async () => {
      const createPostDto = {
        content: 'Post content',
        title: 'Post title',
        user_id: 1,
      };
      const newPost = { postId: '1', ...createPostDto };

      mockPool.query.mockResolvedValueOnce({ rows: [newPost] });

      mockRedisCacheService.get.mockResolvedValueOnce(null);
      mockRedisCacheService.set.mockResolvedValueOnce(true);

      const result = await postsService.create(createPostDto);

      expect(result).toEqual(newPost);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO posts (content, title, user_id) VALUES ($1, $2, $3) RETURNING *',
        [createPostDto.content, createPostDto.title, createPostDto.user_id],
      );
      expect(mockRedisCacheService.set).toHaveBeenCalledWith(
        'posts: all',
        JSON.stringify([newPost]),
        3600,
      );
    });

    it('should throw InternalServerErrorException if there is a database error', async () => {
      const createPostDto = {
        content: 'Post content',
        title: 'Post title',
        user_id: 1,
      };

      mockPool.query.mockRejectedValueOnce(new Error('Database Error'));

      await expect(postsService.create(createPostDto)).rejects.toThrow(
        new InternalServerErrorException('Database Error'),
      );
    });
  });

  describe('getAllPosts', () => {
    it('should return posts from Redis if available', async () => {
      const cachedPosts = [
        { postId: '1', title: 'Post 1', content: 'Content 1' },
      ];

      mockRedisCacheService.get.mockResolvedValueOnce(
        JSON.stringify(cachedPosts),
      );

      const result = await postsService.getAllPosts();

      expect(result).toEqual(cachedPosts);
      expect(mockRedisCacheService.get).toHaveBeenCalledWith('posts: all');
    });

    it('should return posts from database if no cache is found', async () => {
      const dbPosts = [{ postId: '1', title: 'Post 1', content: 'Content 1' }];

      mockRedisCacheService.get.mockResolvedValueOnce(null);
      mockPool.query.mockResolvedValueOnce({ rows: dbPosts });

      const result = await postsService.getAllPosts();

      expect(result).toEqual(dbPosts);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM posts');
    });

    it('should throw InternalServerErrorException if there is a database error', async () => {
      mockRedisCacheService.get.mockResolvedValueOnce(null);
      mockPool.query.mockRejectedValueOnce(new Error('Database Error'));

      await expect(postsService.getAllPosts()).rejects.toThrow(
        new InternalServerErrorException('Database Error'),
      );
    });
  });
});
