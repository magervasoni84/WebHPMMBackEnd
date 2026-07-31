import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from './config/config.js';
import userRoutes from './routes/user.routes.js';
import visitaRoutes from './routes/visitar.router.js';
import authRoutes from './routes/auth.routes.js';
import qrCirugiaRoutes from './routes/qrCirugia.routes.js';
import entregasRoutes from './routes/entregas.routes.js';
import { getBuscarXPaciente } from './controllers/visitar.controlles.js';
import { getMsPool } from './config/configDBms.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const storagePath = path.resolve(__dirname, '..', 'storage');

const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use('/storage', express.static(storagePath));
app.use('/api/storage', express.static(storagePath));

app.use('/api/users', userRoutes);
app.use('/api/visitar', visitaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/quiro', qrCirugiaRoutes);
app.use('/api', entregasRoutes);

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