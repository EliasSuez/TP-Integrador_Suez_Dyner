import pool from '../models/db.js';

// GET /api/event-location
export const getAllEventLocations = async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query(
    'SELECT * FROM event_locations WHERE id_creator_user = $1',
    [userId]
  );
  return res.status(200).json(result.rows);
};

// GET /api/event-location/:id
export const getEventLocationById = async (req, res) => {
  const userId = req.user.id;
  const locationId = Number(req.params.id);
  const result = await pool.query(
    'SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2',
    [locationId, userId]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Ubicación no encontrada o no pertenece al usuario' });
  }
  return res.status(200).json(result.rows[0]);
};

// POST /api/event-location
export const createEventLocation = async (req, res) => {
  const userId = req.user.id;
  const { name, full_address, max_capacity, latitude, longitude, id_location } = req.body;
  const result = await pool.query(
    `INSERT INTO event_locations 
    (name, full_address, max_capacity, latitude, longitude, id_creator_user, id_location) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, full_address, max_capacity, latitude, longitude, userId, id_location]
  );
  return res.status(201).json(result.rows[0]);
};

// PUT /api/event-location/:id
export const updateEventLocation = async (req, res) => {
  const userId = req.user.id;
  const locationId = Number(req.params.id);
  const { name, full_address, max_capacity, latitude, longitude, id_location } = req.body;
  // Asegúrate de que la location sea del usuario
  const check = await pool.query(
    'SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2',
    [locationId, userId]
  );
  if (check.rows.length === 0) {
    return res.status(404).json({ message: 'Ubicación no encontrada o no pertenece al usuario' });
  }
  const result = await pool.query(
    `UPDATE event_locations 
    SET name = $1, full_address = $2, max_capacity = $3, latitude = $4, longitude = $5, id_location = $6 
    WHERE id = $7 RETURNING *`,
    [name, full_address, max_capacity, latitude, longitude, id_location, locationId]
  );
  return res.status(200).json(result.rows[0]);
};

// DELETE /api/event-location/:id
export const deleteEventLocation = async (req, res) => {
  const userId = req.user.id;
  const locationId = Number(req.params.id);
  // Asegúrate de que la location sea del usuario
  const check = await pool.query(
    'SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2',
    [locationId, userId]
  );
  if (check.rows.length === 0) {
    return res.status(404).json({ message: 'Ubicación no encontrada o no pertenece al usuario' });
  }
  await pool.query(
    'DELETE FROM event_locations WHERE id = $1',
    [locationId]
  );
  return res.status(200).json({ message: 'Ubicación eliminada' });
};