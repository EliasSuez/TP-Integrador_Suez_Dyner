import express from 'express';
import { getEvents, getEventDetail } from '../controllers/eventController.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventDetail);

console.log('DATABASE_URL en eventRoutes:', process.env.DATABASE_URL);

export default router;