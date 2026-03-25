import { Router } from 'express';
import { getVisitas, updatePacienteObservacion, putVisitante, getBuscarXPaciente } from '../controllers/visitar.controlles.js';

const router = Router();

// Mounted in index.js at '/visitar', so use relative paths here
router.get('/', getVisitas);
router.get('/buscar-xpaciente', getBuscarXPaciente);
router.put('/paciente/:id', updatePacienteObservacion);
router.post('/acompaniante', putVisitante);

export default router;