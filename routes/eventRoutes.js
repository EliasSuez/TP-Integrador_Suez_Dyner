import express from 'express';
import {
  getEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
  enrollToEvent,       
  unenrollFromEvent    
} from '../controllers/eventController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventDetail);
router.post('/', authenticateToken, createEvent);
router.put('/', authenticateToken, updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);

// Inscripción/desuscripción
router.post('/:id/enrollment', authenticateToken, enrollToEvent);
router.delete('/:id/enrollment', authenticateToken, unenrollFromEvent);

export default router;