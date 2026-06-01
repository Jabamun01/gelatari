import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import {
  loginHandler,
  verifyHandler,
  changePasswordHandler,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', asyncHandler(loginHandler));
router.get('/verify', authMiddleware, asyncHandler(verifyHandler));
router.post('/change-password', authMiddleware, asyncHandler(changePasswordHandler));

export default router;
