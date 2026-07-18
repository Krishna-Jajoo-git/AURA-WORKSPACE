import express from 'express';
import { handleGoogleLogin,getMe,handleLogout } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/google-login',handleGoogleLogin);
router.post('/logout',handleLogout);
router.get('/me',requireAuth,getMe);

export default router;