import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { PORT } from './config/config.js';
import userRoutes from './routes/user.routes.js';
import visitaRoutes from './routes/visitar.router.js';

// Cargar variables de entorno
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());
app.use(userRoutes, visitaRoutes)

app.listen(PORT, () => {
  console.log(`El servidor está corriendo en http://127.0.0.1:${PORT}`)
})

app.on('error', (err) => {
  console.error('Error en el servidor:', err)
})