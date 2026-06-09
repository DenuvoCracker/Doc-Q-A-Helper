const db = require('./index');

async function setup() {
  try {
    console.log('Setting up database...');

    await db.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log('pgvector extension enabled');

    await db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        page_count INTEGER,
        chunk_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('documents table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        embedding vector(3072),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('chunks table ready');

    // await db.query(`
    //   CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    //   ON chunks USING ivfflat (embedding vector_cosine_ops)
    //   WITH (lists = 100)
    // `);
    console.log('vector index created');

    console.log('\nDatabase setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Setup error:', err.message);
    console.error('\nMake sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. DATABASE_URL is set in server/.env');
    console.error('3. pgvector extension is installed (https://github.com/pgvector/pgvector)');
    process.exit(1);
  }
}

setup();
