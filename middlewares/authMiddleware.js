import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No autenticado' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token faltante' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
};

export default authenticateToken;