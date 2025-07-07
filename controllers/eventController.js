import pool from '../models/db.js';
import jwt from 'jsonwebtoken';

// Helper para obtener el ID del usuario autenticado desde el JWT
function getUserIdFromToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

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

// POST /api/event/ - Crear evento (autenticado)
export const createEvent = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance } = req.body;

  // Validaciones
  if (!name || name.length < 3 || !description || description.length < 3) {
    return res.status(400).json({ success: false, message: 'El name o description están vacíos o tienen menos de tres (3) letras.' });
  }
  if (price < 0 || duration_in_minutes < 0) {
    return res.status(400).json({ success: false, message: 'El price o duration_in_minutes son menores que cero.' });
  }
  // Validar max_assistance <= max_capacity del id_event_location
  try {
    const locResult = await pool.query('SELECT max_capacity FROM event_locations WHERE id = $1', [id_event_location]);
    if (locResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'id_event_location inválido.' });
    }
    const max_capacity = locResult.rows[0].max_capacity;
    if (max_assistance > max_capacity) {
      return res.status(400).json({ success: false, message: 'El max_assistance es mayor que el max_capacity del id_event_location.' });
    }

    // Insertar evento
    const insertQuery = `
      INSERT INTO events 
        (name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      name, description, id_event_location, start_date, duration_in_minutes, price, 
      enabled_for_enrollment ?? true, max_assistance, userId
    ]);

    return res.status(201).json({ success: true, message: 'Evento creado', event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al crear el evento' });
  }
};

// PUT /api/event/ - Editar evento (autenticado, solo propio)
export const updateEvent = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { id, name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance } = req.body;

  // Buscar evento y verificar propiedad
  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    const event = eventResult.rows[0];
    if (event.id_creator_user !== userId) {
      return res.status(404).json({ success: false, message: 'El evento no pertenece al usuario autenticado' });
    }

    // Validaciones
    if (!name || name.length < 3 || !description || description.length < 3) {
      return res.status(400).json({ success: false, message: 'El name o description están vacíos o tienen menos de tres (3) letras.' });
    }
    if (price < 0 || duration_in_minutes < 0) {
      return res.status(400).json({ success: false, message: 'El price o duration_in_minutes son menores que cero.' });
    }
    // Validar max_assistance <= max_capacity del id_event_location
    const locResult = await pool.query('SELECT max_capacity FROM event_locations WHERE id = $1', [id_event_location]);
    if (locResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'id_event_location inválido.' });
    }
    const max_capacity = locResult.rows[0].max_capacity;
    if (max_assistance > max_capacity) {
      return res.status(400).json({ success: false, message: 'El max_assistance es mayor que el max_capacity del id_event_location.' });
    }

    // Actualizar evento
    const updateQuery = `
      UPDATE events SET 
        name = $1, description = $2, id_event_location = $3, start_date = $4, 
        duration_in_minutes = $5, price = $6, enabled_for_enrollment = $7, max_assistance = $8
      WHERE id = $9
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [
      name, description, id_event_location, start_date, duration_in_minutes, price, 
      enabled_for_enrollment ?? true, max_assistance, id
    ]);

    return res.status(200).json({ success: true, message: 'Evento actualizado', event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al actualizar el evento' });
  }
};

// DELETE /api/event/:id - Eliminar evento (autenticado, solo propio)
export const deleteEvent = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { id } = req.params;

  try {
    // Buscar evento y verificar propiedad
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    const event = eventResult.rows[0];
    if (event.id_creator_user !== userId) {
      return res.status(404).json({ success: false, message: 'El evento no pertenece al usuario autenticado' });
    }

    // Verificar si hay usuarios inscriptos
    const inscriptosResult = await pool.query(
      'SELECT COUNT(*) FROM event_enrollments WHERE id_event = $1', [id]
    );
    if (parseInt(inscriptosResult.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Existe al menos un usuario registrado al evento.' });
    }

    // Eliminar evento
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Evento eliminado', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al eliminar el evento' });
  }
};