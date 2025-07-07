import express from 'express';
import {
  getEvents,
  getEventDetail,
  createEvent,     
  updateEvent,     
  deleteEvent      
} from '../controllers/eventController.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventDetail);
router.post('/', createEvent);      // <-- crea evento
router.put('/', updateEvent);       // <-- edita evento
router.delete('/:id', deleteEvent); // <-- elimina evento

console.log('DATABASE_URL en eventRoutes:', process.env.DATABASE_URL);

export default router;