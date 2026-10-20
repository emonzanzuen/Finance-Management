import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const directUrl = process.env.DIRECT_URL || (process.env.NODE_ENV === 'production' ? undefined : process.env.DATABASE_URL_UNPOOLED);
if (process.env.NODE_ENV === 'production' && !process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL harus diatur di production untuk migrasi Prisma.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
    ...(directUrl ? { directUrl } : {}),
  },
});
