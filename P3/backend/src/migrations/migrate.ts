import fs from 'fs';
import path from 'path';
import { query } from '../db';

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await query(schema);

    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
