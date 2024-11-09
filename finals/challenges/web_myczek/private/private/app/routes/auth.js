const express = require('express');
const router = express.Router();
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

const TTL = '1h';
const JWT_SECRET = nanoid(32);

console.log(`JWT_SECRET: ${JWT_SECRET}`);

function findUser(username) {
  return users[username];
}

function checkAdmin(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const tokenValue = token.split(' ')[1];
    const decoded = jwt.decode(tokenValue);

    jwt.verify(tokenValue, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You must be an admin to access this resource' });
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token or secret' });
  }
}

router.get('/flag', checkAdmin, (req, res) => {
  const flag = "justCTF{r3spect4!}";
  return res.status(200).json({ flag });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  const userRole = 'user';

  console.log(req.body);

  if (users[username]) {
    return res.status(400).json({ message: 'User already exists' });
  }

  if(typeof username != "string" || typeof password != "string"){
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  users[username] = { username, password, role: userRole };
  return res.status(201).json({ message: 'User registered with role user' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUser(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const customClaims = {
    username: user.username,
    role: user.role
  };

  const accessToken = jwt.sign(customClaims, JWT_SECRET, {
    expiresIn: TTL,
    issuer: 'twoja_stara',
  });

  return res.status(200).json({ message: 'Logged in', accessToken });
});


router.post('/change-password', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const { old_password } = req.body;
  
  console.log(`log change-password: `, req.body);

  const tokenValue = token.split(' ')[1];
  const decoded = jwt.decode(tokenValue);
  const user = findUser(decoded.username);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    jwt.verify(tokenValue, JWT_SECRET);

    if (user.password != old_password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    user.password = nanoid(old_password.length);

    return res.status(200).json({ message: `Secure password generated: ${user.password }` });
  }
  catch (err) {
    return res.status(500).json({ message: 'Error during password change' });
  }
});

module.exports = router;
