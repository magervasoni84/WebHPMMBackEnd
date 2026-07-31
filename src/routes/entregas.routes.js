 import { Router } from 'express';
import { getEntregas } from '../controllers/entregas.controllers.js';

const router = Router();

/**
 * GET /api/entregas?tipo=...&protocolo=...&paciente=...
 * POST /api/entregas  { tipo, protocolo, paciente }
 */
router.get('/entregas', getEntregas);
router.post('/entregas', getEntregas);

export default router;
