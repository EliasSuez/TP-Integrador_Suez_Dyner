import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testDB() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('¡Conexión exitosa! Hora actual en DB:', res.rows[0].now);
  } catch (err) {
    console.error('Error al conectar:', err);
  } finally {
    await pool.end();
  }
}

testDB();