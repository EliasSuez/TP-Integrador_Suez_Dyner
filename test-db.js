import sql from './models/db.js';

try {
  const result = await sql`SELECT NOW()`;
  console.log('Conexión exitosa:', result[0]);
  process.exit(0);
} catch (err) {
  console.error('Error de conexión:', err);
  process.exit(1);
}