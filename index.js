// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const signatureRouter = require('./routes/signature');
const app = express();
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('¡Hola desde Express!');
});
app.use('/signature', signatureRouter);
app.listen(3000, () => {
  console.log('Servidor escuchando en puerto 3000');
});