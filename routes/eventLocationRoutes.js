import express from 'express';
import authenticateToken from '../middlewares/authMiddleware.js';
import {
  getAllEventLocations,
  getEventLocationById,
  createEventLocation,
  updateEventLocation,
  deleteEventLocation
} from '../controllers/eventLocationController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllEventLocations); // Todas las locations del usuario autenticado
router.get('/:id', authenticateToken, getEventLocationById); // Location por id (si es del usuario)
router.post('/', authenticateToken, createEventLocation); // Crear location
router.put('/:id', authenticateToken, updateEventLocation); // Editar location
router.delete('/:id', authenticateToken, deleteEventLocation); // Eliminar location

export default router;