const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

// Use CORS middleware
app.use(cors());
app.use(express.json());

let users = [];

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  console.log(`Received registration request for username: ${username}`);
  if (!username || !password) {
    console.log('Username or password missing');
    return res.status(400).send('Username and password are required');
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = { id: users.length + 1, username, password: hashedPassword };
  users.push(user);
  console.log(`User registered with ID: ${user.id}`);
  res.status(201).send({ userId: user.id });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key');
    console.log(`User authenticated: ${username}`);
    return res.status(200).send({ token });
  }
  console.log('Invalid login attempt');
  res.status(401).send('Invalid credentials');
});

app.get('/marketplace', (req, res) => {
  const products = [
    { id: 1, name: 'Crop Insurance - Basic', price: 50 },
    { id: 2, name: 'Weather Risk Insurance', price: 75 },
    { id: 3, name: 'Comprehensive Farm Insurance', price: 120 },
  ];
  console.log('Marketplace accessed');
  res.status(200).json(products);
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
