import pool from '../models/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// Validaciones simples
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 3;
}
function isValidPassword(pass) {
  return typeof pass === 'string' && pass.length >= 3;
}

// POST /api/user/register
export const register = async (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  if (!isValidName(first_name) || !isValidName(last_name)) {
    return res.status(400).json({
      success: false,
      message: "Los campos first_name o last_name están vacíos o tienen menos de tres (3) letras."
    });
  }
  if (!isValidEmail(username)) {
    return res.status(400).json({
      success: false,
      message: "El email es invalido."
    });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: "El campo password está vacío o tiene menos de tres (3) letras."
    });
  }

  try {
    // Verificar existencia
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya existe."
      });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (first_name, last_name, username, password)
       VALUES ($1, $2, $3, $4)`,
      [first_name.trim(), last_name.trim(), username.trim().toLowerCase(), hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente."
    });
  } catch (err) {
    console.error('Error en register:', err);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor."
    });
  }
};

// POST /api/user/login
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!isValidEmail(username)) {
    return res.status(400).json({
      success: false,
      message: "El email es invalido.",
      token: ""
    });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim().toLowerCase()]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario o clave inválida.",
        token: ""
      });
    }
    const user = userResult.rows[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Usuario o clave inválida.",
        token: ""
      });
    }

    const token = jwt.sign(
      { id: user.id, first_name: user.first_name, last_name: user.last_name, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: "",
      token
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
      token: ""
    });
  }
};