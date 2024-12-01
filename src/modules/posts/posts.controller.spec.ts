import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CreatePostDto } from '../../dto/posts.dto';
import { Post } from '../../models/posts.interface';

jest.mock('../auth/guards/auth.guard');

const mockPostsService = {
  create: jest.fn(),
  getAllPosts: jest.fn(),
};

describe('PostsController', () => {
  let postsController: PostsController;
  let postsService: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    }).compile();

    postsController = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
  });

  describe('create', () => {
    it('should create a post and return the post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'Content of test post',
        user_id: 1,
      };
      const result: Post = { id: 1, ...createPostDto };

      mockPostsService.create.mockResolvedValue(result);

      const post = await postsController.create(createPostDto);

      expect(post).toEqual(result);
      expect(postsService.create).toHaveBeenCalledWith(createPostDto);
    });
  });

  describe('getAllPosts', () => {
    it('should return an array of posts', async () => {
      const result: Post[] = [
        {
          id: 1,
          title: 'First Post',
          content: 'Content of first post',
          user_id: 2,
        },
        {
          id: 2,
          title: 'Second Post',
          content: 'Content of second post',
          user_id: 3,
        },
      ];

      mockPostsService.getAllPosts.mockResolvedValue(result);
      const posts = await postsController.getAllPosts();
      expect(posts).toEqual(result);
      expect(postsService.getAllPosts).toHaveBeenCalled();
    });
  });
});
