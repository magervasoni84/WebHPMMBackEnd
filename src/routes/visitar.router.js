import { Router } from 'express';
import { getVisitas, updatePacienteObservacion, putVisitante } from '../controllers/visitar.controlles.js';

const router = Router();

router.get('/visitar', getVisitas);
router.put('/visitar/paciente/:id', updatePacienteObservacion);
router.post('/visitar/acompaniante/', putVisitante);

export default router;