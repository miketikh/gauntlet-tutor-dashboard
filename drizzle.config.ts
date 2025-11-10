import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema/*.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 54422,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
      },
} satisfies Config;
