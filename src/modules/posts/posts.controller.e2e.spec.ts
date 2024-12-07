import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PostsService } from './posts.service';
import { CreatePostDto } from '../../dto/posts.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

// Mock PostsService
const mockPostsService = {
  create: jest
    .fn()
    .mockResolvedValue({ id: 1, title: 'Test Post', content: 'Test content' }),
  getAllPosts: jest.fn().mockResolvedValue([
    { id: 1, title: 'Test Post', content: 'Test content' },
    { id: 2, title: 'Another Post', content: 'Another content' },
  ]),
};

describe('PostsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostsService)
      .useValue(mockPostsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST posts (create post)', () => {
    const createPostDto: CreatePostDto = {
      title: 'Test Post',
      content: 'Test content',
      user_id: 1,
    };

    return request(app.getHttpServer())
      .post('/posts')
      .send(createPostDto)
      .expect(201)
      .expect({
        id: 1,
        title: 'Test Post',
        content: 'Test content',
        user_id: 1,
      });
  });

  it('/GET posts (get all posts) - without auth', () => {
    return request(app.getHttpServer()).get('/posts').expect(401);
  });

  it('/GET posts (get all posts) - with auth', () => {
    return request(app.getHttpServer())
      .get('/posts')
      .set('Authorization', 'Bearer valid_token')
      .expect(200)
      .expect([
        { id: 1, title: 'Test Post', content: 'Test content' },
        { id: 2, title: 'Another Post', content: 'Another content' },
      ]);
  });

  afterAll(async () => {
    await app.close();
  });
});
