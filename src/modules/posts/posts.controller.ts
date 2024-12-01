import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreatePostDto } from '../../dto/posts.dto';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Post as IPost } from '../../models/posts.interface';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto): Promise<IPost> {
    return this.postsService.create(createPostDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  getAllPosts(): Promise<IPost[]> {
    return this.postsService.getAllPosts();
  }
}
