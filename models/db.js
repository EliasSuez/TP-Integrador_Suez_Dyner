import pkg from 'pg';
const { Pool } = pkg;

// Lee la URL completa de la base de datos del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Si tu proveedor exige SSL, descomenta esto:
  // ssl: { rejectUnauthorized: false }
});

export default pool;