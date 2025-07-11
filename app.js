import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors'; // <--- AGREGA ESTA LÍNEA

import eventLocationRoutes from './routes/eventLocationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

const app = express();

app.use(cors()); // <--- AGREGA ESTA LÍNEA

// Middleware para parsear JSON
app.use(express.json());

// Rutas principales
app.use('/api/event', eventRoutes);
app.use('/api/user', authRoutes);
app.use('/api/event-location', eventLocationRoutes);

// Ruta raíz opcional (puedes quitarla si no la usas)
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;