import express from 'express';
import { generateResponse, analyzeCode } from '../controllers/vaultController.js';

const router = express.Router();

router.post('/generate', generateResponse);
router.post('/analyze', analyzeCode);

export default router;