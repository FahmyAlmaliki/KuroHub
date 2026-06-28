import fs from 'fs';
import path from 'path';
import { pool } from './postgres';

async function migrate(): Promise<void> {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);

  const client = await pool.connect();

  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      if (!sql.trim()) {
        console.log(`  ⏭  ${file} — empty, skipping`);
        continue;
      }

      console.log(`  ▶  Running ${file}...`);
      await client.query(sql);
      console.log(`  ✅ ${file} — OK`);
    }

    console.log('\nAll migrations completed successfully.');
  } catch (err) {
    console.error('\nMigration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
