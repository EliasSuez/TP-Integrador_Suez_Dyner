const express = require('express');
const cors = require('cors');
require('dotenv').config();

const eventRoutes = require('./routes/eventRoutes');
// ...otros require de rutas

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/event', eventRoutes);
// ...otras rutas

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en puerto ${PORT}`);
});