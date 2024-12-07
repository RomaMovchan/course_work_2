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

describe('PostsService (e2e)', () => {
  let postsService: PostsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: 'PG_CONNECTION', useValue: mockPool },
        { provide: RedisCacheService, useValue: mockRedisCacheService },
      ],
    }).compile();

    postsService = module.get<PostsService>(PostsService);
  });

  it('should create a post successfully', async () => {
    const createPostDto = {
      content: 'Post content',
      title: 'Post Title',
      user_id: 1,
    };
    const mockDbResponse = { rows: [{ id: 1, ...createPostDto }] };

    mockPool.query.mockResolvedValue(mockDbResponse);
    mockRedisCacheService.get.mockResolvedValue(null); // Simulating no cached posts

    const result = await postsService.create(createPostDto);

    expect(result).toEqual({ id: 1, ...createPostDto });
    expect(mockPool.query).toHaveBeenCalledWith(
      `INSERT INTO posts (content, title, user_id) VALUES ($1, $2, $3) RETURNING *`,
      ['Post content', 'Post Title', 1],
    );
    expect(mockRedisCacheService.set).toHaveBeenCalledWith(
      'posts: all',
      JSON.stringify([{ id: 1, ...createPostDto }]),
      60000,
    );
  });

  it('should throw BadRequestException if missing required fields in createPostDto', async () => {
    const createPostDto = { content: 'Post content', title: '', user_id: 1 };

    await expect(postsService.create(createPostDto)).rejects.toThrowError(
      new BadRequestException('Please provide full data'),
    );
  });

  it('should throw InternalServerErrorException if database query fails in create', async () => {
    const createPostDto = {
      content: 'Post content',
      title: 'Post Title',
      user_id: 1,
    };

    mockPool.query.mockRejectedValue(new Error('Database Error'));

    await expect(postsService.create(createPostDto)).rejects.toThrowError(
      new InternalServerErrorException('Database Error'),
    );
  });

  it('should return cached posts if available in getAllPosts', async () => {
    const cachedPosts = JSON.stringify([
      { id: 1, content: 'Post content', title: 'Post Title', user_id: 1 },
    ]);

    mockRedisCacheService.get.mockResolvedValue(cachedPosts);

    const result = await postsService.getAllPosts();

    expect(result).toEqual(JSON.parse(cachedPosts));
    expect(mockPool.query).not.toHaveBeenCalled(); // Ensure no DB call
  });

  it('should query the database and return posts if no cached posts are available in getAllPosts', async () => {
    const mockDbResponse = {
      rows: [
        { id: 1, content: 'Post content', title: 'Post Title', user_id: 1 },
      ],
    };

    mockRedisCacheService.get.mockResolvedValue(null); // No cached posts
    mockPool.query.mockResolvedValue(mockDbResponse);

    const result = await postsService.getAllPosts();

    expect(result).toEqual(mockDbResponse.rows);
    expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM posts');
    expect(mockRedisCacheService.set).toHaveBeenCalledWith(
      'posts: all',
      JSON.stringify(mockDbResponse.rows),
      60000,
    );
  });

  it('should throw InternalServerErrorException if database query fails in getAllPosts', async () => {
    mockRedisCacheService.get.mockResolvedValue(null); // No cached posts
    mockPool.query.mockRejectedValue(new Error('Database Error'));

    await expect(postsService.getAllPosts()).rejects.toThrowError(
      new InternalServerErrorException('Database Error'),
    );
  });

  afterAll(() => {
    jest.clearAllMocks(); // Clear mocks after tests
  });
});
