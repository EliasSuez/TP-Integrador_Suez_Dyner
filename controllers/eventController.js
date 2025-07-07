import pool from '../models/db.js';

// GET /api/event/
export const getEvents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT
          e.id,
          e.name,
          e.description,
          e.start_date,
          e.duration_in_minutes,
          e.price,
          e.enabled_for_enrollment,
          e.max_assistance,
          json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'username', u.username
          ) AS creator_user,
          json_build_object(
            'id', el.id,
            'name', el.name,
            'full_address', el.full_address,
            'max_capacity', el.max_capacity,
            'latitude', el.latitude,
            'longitude', el.longitude
          ) AS location
      FROM events e
      JOIN users u ON e.id_creator_user = u.id
      JOIN event_locations el ON e.id_event_location = el.id
      ORDER BY e.start_date DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      page,
      limit,
      results: result.rows.length,
      events: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
};