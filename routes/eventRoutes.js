const express = require('express');
const router = express.Router();
const { getEvents } = require('../controllers/eventController');

// Listado paginado y filtrado de eventos
router.get('/', getEvents);

module.exports = router;