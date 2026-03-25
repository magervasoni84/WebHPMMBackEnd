import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from './config/config.js';
import userRoutes from './routes/user.routes.js';
import visitaRoutes from './routes/visitar.router.js';
import { getBuscarXPaciente } from './controllers/visitar.controlles.js';
import { getMsPool } from './config/configDBms.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use('/users', userRoutes);
app.use('/visitar', visitaRoutes);

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://127.0.0.1:${PORT} (modo: ${process.env.NODE_ENV || 'development'})`);

  if ((process.env.NODE_ENV || 'development') === 'development') {
    try {
      await getMsPool();
      console.log('Warmup MSSQL en development completado.');
    } catch (err) {
      console.error('Warmup MSSQL en development falló:', err.message);
    }
  }
});

app.on('error', (err) => {
  console.error('Error en el servidor:', err);
});