const pool = require('../models/db');

// GET /api/event
exports.getEvents = async (req, res) => {
  try {
    // Paginación y filtros
    const limit = parseInt(req.query.limit) || 15;
    const offset = parseInt(req.query.offset) || 0;
    const { name, startdate, tag } = req.query;

    let filters = [];
    let values = [limit, offset];
    let idx = 3;

    if (name) {
      filters.push(`LOWER(e.name) LIKE LOWER($${idx})`);
      values.push(`%${name}%`);
      idx++;
    }
    if (startdate) {
      filters.push(`e.start_date::date = $${idx}`);
      values.push(startdate);
      idx++;
    }
    if (tag) {
      filters.push(`$${idx} = ANY(tags_array)`);
      values.push(tag);
      idx++;
    }

    let where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    // Ejemplo de consulta (ajusta los JOIN según tu modelo real)
    const result = await pool.query(`
      SELECT 
        e.id, e.name, e.description, e.start_date, e.duration_in_minutes, e.price,
        e.enabled_for_enrollment, e.max_assistance,
        json_build_object('id', u.id, 'username', u.username, 'first_name', u.first_name, 'last_name', u.last_name) as creator_user,
        json_build_object(
          'id', l.id,
          'name', l.name,
          'full_address', l.full_address,
          'latitude', l.latitude,
          'longitude', l.longitude
        ) as event_location
      FROM event e
      JOIN users u ON u.id = e.id_creator_user
      JOIN event_location l ON l.id = e.id_event_location
      ${where}
      ORDER BY e.start_date DESC
      LIMIT $1 OFFSET $2
    `, values);

    res.json({
      collection: result.rows,
      pagination: {
        limit,
        offset,
        nextPage: result.rows.length === limit ? offset + limit : null,
        total: result.rows.length 
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
};