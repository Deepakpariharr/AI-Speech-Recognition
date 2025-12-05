import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.PG_CONNECTION;
if (!connectionString) {
  console.error('FATAL: PG_CONNECTION is not set. See .env.example');
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
});
