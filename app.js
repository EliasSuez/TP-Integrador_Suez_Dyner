import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import eventRoutes from './routes/eventRoutes.js';

const app = express();

app.use(express.json());

// Tus rutas
app.use('/api/event', eventRoutes);

// Puerto del servidor (usá process.env.PORT o un valor por defecto)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});