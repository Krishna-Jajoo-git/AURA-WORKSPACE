import express from 'express';
import { handleGoogleLogin } from '../controllers/userController.js';

const router = express.Router();

router.post('/google-login',handleGoogleLogin);

export default router;