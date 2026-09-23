const jwt = require('jsonwebtoken');
const t = jwt.sign(
  { id: 11, email: 'admin@gmail.com', role: 'admin', plan: 'Admin' },
  'SECRET_KEY',
  { expiresIn: '1d' }
);
console.log(t);
