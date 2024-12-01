import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreatePostDto } from '../../dto/posts.dto';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }
}
