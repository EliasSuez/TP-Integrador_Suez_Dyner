import pool from '../models/db.js';

// GET /api/event/
export const getEvents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { name, startdate, tag } = req.query;
  let filters = [];
  let params = [];
  let paramIndex = 1;

  if (name) {
    filters.push(`LOWER(e.name) LIKE LOWER($${paramIndex})`);
    params.push(`%${name}%`);
    paramIndex++;
  }
  if (startdate) {
    filters.push(`CAST(e.start_date AS DATE) = $${paramIndex}`);
    params.push(startdate);
    paramIndex++;
  }
  if (tag) {
    filters.push(`EXISTS (
      SELECT 1 FROM event_tags et
      JOIN tags t ON et.id_tag = t.id
      WHERE et.id_event = e.id AND LOWER(t.name) = LOWER($${paramIndex})
    )`);
    params.push(tag);
    paramIndex++;
  }

  params.push(limit, offset);
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT
          e.id,
          e.name,
          e.description,
          e.id_event_location,
          e.start_date,
          e.duration_in_minutes,
          e.price,
          e.enabled_for_enrollment,
          e.max_assistance,
          e.id_creator_user,
          -- Creador del evento
          json_build_object(
            'id', cu.id,
            'first_name', cu.first_name,
            'last_name', cu.last_name,
            'username', cu.username,
            'password', cu.password
          ) AS creator_user,
          -- Ubicación completa del evento
          json_build_object(
            'id', el.id,
            'id_location', el.id_location,
            'name', el.name,
            'full_address', el.full_address,
            'max_capacity', el.max_capacity,
            'latitude', el.latitude,
            'longitude', el.longitude,
            'id_creator_user', el.id_creator_user,
            -- Localidad anidada
            'location', json_build_object(
              'id', l.id,
              'name', l.name,
              'id_province', l.id_province,
              'latitude', l.latitude,
              'longitude', l.longitude,
              -- Provincia anidada
              'province', json_build_object(
                'id', p.id,
                'name', p.name,
                'full_name', p.full_name,
                'latitude', p.latitude,
                'longitude', p.longitude,
                'display_order', p.display_order
              )
            ),
            -- Creador del lugar
            'creator_user', json_build_object(
              'id', u2.id,
              'first_name', u2.first_name,
              'last_name', u2.last_name,
              'username', u2.username,
              'password', u2.password
            )
          ) AS event_location
      FROM events e
      LEFT JOIN users cu ON e.id_creator_user = cu.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN users u2 ON el.id_creator_user = u2.id
      LEFT JOIN locations l ON el.id_location = l.id
      LEFT JOIN provinces p ON l.id_province = p.id
      ${where}
      ORDER BY e.start_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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

// GET /api/event/:id
export const getEventDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const eventQuery = `
      SELECT
        e.id,
        e.name,
        e.description,
        e.id_event_location,
        e.start_date,
        e.duration_in_minutes,
        e.price,
        e.enabled_for_enrollment,
        e.max_assistance,
        e.id_creator_user,
        -- Creador del evento
        json_build_object(
          'id', cu.id,
          'first_name', cu.first_name,
          'last_name', cu.last_name,
          'username', cu.username,
          'password', cu.password
        ) AS creator_user,
        -- Ubicación completa del evento
        json_build_object(
          'id', el.id,
          'id_location', el.id_location,
          'name', el.name,
          'full_address', el.full_address,
          'max_capacity', el.max_capacity,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'id_creator_user', el.id_creator_user,
          -- Localidad anidada
          'location', json_build_object(
            'id', l.id,
            'name', l.name,
            'id_province', l.id_province,
            'latitude', l.latitude,
            'longitude', l.longitude,
            -- Provincia anidada
            'province', json_build_object(
              'id', p.id,
              'name', p.name,
              'full_name', p.full_name,
              'latitude', p.latitude,
              'longitude', p.longitude,
              'display_order', p.display_order
            )
          ),
          -- Creador del lugar
          'creator_user', json_build_object(
            'id', u2.id,
            'first_name', u2.first_name,
            'last_name', u2.last_name,
            'username', u2.username,
            'password', u2.password
          )
        ) AS event_location
      FROM events e
      LEFT JOIN users cu ON e.id_creator_user = cu.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN users u2 ON el.id_creator_user = u2.id
      LEFT JOIN locations l ON el.id_location = l.id
      LEFT JOIN provinces p ON l.id_province = p.id
      WHERE e.id = $1
      LIMIT 1
    `;
    const eventResult = await pool.query(eventQuery, [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    const event = eventResult.rows[0];

    res.status(200).json(event);
  } catch (err) {
    console.error('Error al obtener detalle de evento:', err);
    res.status(500).json({ error: 'Error al obtener el detalle del evento' });
  }
};