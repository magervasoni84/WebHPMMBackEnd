import { Router } from 'express';
import { getQrCirugias } from '../controllers/qrCirugia.controllers.js';

const router = Router();

router.get('/cirugias', getQrCirugias);

export default router;
