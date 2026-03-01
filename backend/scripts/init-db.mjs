import fs from 'node:fs/promises';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const maxAttempts = 30;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  const sql = await fs.readFile(new URL('../sql/init.sql', import.meta.url), 'utf8');

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
      await client.connect();
      await client.query(sql);
      console.log('Database initialized');
      process.exit(0);
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(1000);
    } finally {
      await client.end().catch(() => undefined);
    }
  }
} catch (error) {
  console.error('Failed to initialize database', error);
  process.exitCode = 1;
}
