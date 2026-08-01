import express from 'express';
import { handleGoogleLogin,handleRegister,handleVerifyOTP,handleCustomLogin,handleResendOTP,getMe,handleForgotPassword,handleResetPassword,handleLogout } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/google-login',handleGoogleLogin);
router.post('/register',handleRegister);
router.post('/login',handleCustomLogin);
router.post('/verify-otp',handleVerifyOTP);
router.post('/resend-otp',handleResendOTP);
router.post('/forgot-password',handleForgotPassword);
router.post('/reset-password',handleResetPassword);
router.get('/me',requireAuth,getMe);
router.post('/logout',handleLogout);

export default router;