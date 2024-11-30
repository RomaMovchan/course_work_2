import { Module } from '@nestjs/common'
import { Pool } from 'pg'

const dbProvider = {
  provide: 'PG_CONNECTION',
  useValue: new Pool({
    user: 'user',
    host: 'localhost',
    database: 'social_network_db',
    password: 'password',
    port: 5433,
  }),
}
@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule {}
