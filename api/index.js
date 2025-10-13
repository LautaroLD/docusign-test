// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const signatureRouter = require('./routes/signature');

function createApp() {
  const app = express();


  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json());

  app.get('/', (req, res) => {
    res.send('¡Hola desde Express!');
  });

  app.use('/signature', signatureRouter);

  return app;
}

// Desarrollo local: arranca servidor con listen
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT ?? 3000;
  const app = createApp();
  app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
  });
} else {
  let cachedApp = null;

  async function bootstrap() {
    return createApp();
  }

  module.exports = async function handler(req, res) {
    if (!cachedApp) {
      cachedApp = await bootstrap();
    }
    return cachedApp(req, res);
  };
}