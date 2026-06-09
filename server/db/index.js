const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
