import pool from '../models/db.js';

// GET /api/event/
export const getEvents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { name, startdate, tag } = req.query;
  let filters = [];
  let params = [limit, offset];
  let paramIndex = params.length;
  
  // Filtros dinámicos según query params
  if (name) {
    paramIndex++;
    filters.push(`LOWER(e.name) LIKE LOWER($${paramIndex})`);
    params.push(`%${name}%`);
  }
  if (startdate) {
    paramIndex++;
    filters.push(`e.start_date = $${paramIndex}`);
    params.push(startdate);
  }
  if (tag) {
    paramIndex++;
    // Si la columna e.tags es un arreglo de texto en PostgreSQL
    filters.push(`$${paramIndex} = ANY(e.tags)`);
    params.push(tag);
  }

  let where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

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
      LEFT JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      ${where}
      ORDER BY e.start_date DESC
      LIMIT $1 OFFSET $2`,
      params
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