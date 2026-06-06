import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginHandler,
  verifyHandler,
  changePasswordHandler,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rate limit login attempts: 5 per minute per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Massa intents d\'inici de sessió. Torna-ho a provar més tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit password changes: 3 per minute per IP
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: 'Massa intents de canvi de contrasenya. Torna-ho a provar més tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, loginHandler);
router.get('/verify', authMiddleware, verifyHandler);
router.post('/change-password', passwordChangeLimiter, authMiddleware, changePasswordHandler);

export default router;
