import knex, { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const dbConfig: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "salary_management",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    },
    migrations: {
      directory: "../migrations",
      extension: "ts",
    },
    seeds: {
      directory: "../seeds",
      extension: "ts",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  test: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_TEST_NAME || "salary_management_test",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    },
    migrations: {
      directory: "../migrations",
      extension: "ts",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

const environment = process.env.NODE_ENV || "development";

export const db = knex(dbConfig[environment]);
export default dbConfig;
