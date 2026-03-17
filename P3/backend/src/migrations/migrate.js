// Compiled migration script
// Run with: node dist/migrations/migrate.js

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await pool.query(schema);

    console.log('✅ Database migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
