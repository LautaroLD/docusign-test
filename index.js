// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const signatureRouter = require('./routes/signature');
const app = express();
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Aumentar límite de payload (ej: 10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (req, res) => {
  res.send('¡Hola desde Express!');
});
app.use('/signature', signatureRouter);
app.listen(3000, () => {
  console.log('Servidor escuchando en puerto 3000');
});