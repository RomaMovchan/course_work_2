import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { DbModule } from '../../system-modules/dbo.module';
import { RedisModule } from '../../system-modules/redis.module';

@Module({
  imports: [DbModule, RedisModule],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
