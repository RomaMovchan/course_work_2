import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { DbModule } from '../../system-modules/dbo.module';

@Module({
  imports: [DbModule],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
