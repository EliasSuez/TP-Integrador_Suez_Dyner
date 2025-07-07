import express from 'express';
import { getEvents } from '../controllers/eventController.js';

const router = express.Router();

router.get('/', getEvents);

console.log('DATABASE_URL en eventRoutes:', process.env.DATABASE_URL);

export default router;