import 'dotenv/config';
import type { Knex } from 'knex';

const isProduction = process.env.NODE_ENV === 'production'

const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: isProduction ? { rejectUnauthorized: false } : false }
  : {
      host: process.env.PG_HOST ?? 'localhost',
      port: Number(process.env.PG_PORT ?? 5432),
      database: process.env.PG_DATABASE ?? 'finance_dashboard',
      user: process.env.PG_USER ?? 'postgres',
      password: process.env.PG_PASSWORD ?? '',
    };

const config: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    pool: { min: 2, max: 10 },
  },

  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL
      ? { connectionString: process.env.TEST_DATABASE_URL }
      : {
          host: process.env.PG_HOST ?? 'localhost',
          port: Number(process.env.PG_PORT ?? 5432),
          database: process.env.PG_TEST_DATABASE ?? 'finance_dashboard_test',
          user: process.env.PG_USER ?? 'postgres',
          password: process.env.PG_PASSWORD ?? '',
        },
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    pool: { min: 1, max: 5 },
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
    },
    pool: { min: 2, max: 10 },
  },
};

export default config;
