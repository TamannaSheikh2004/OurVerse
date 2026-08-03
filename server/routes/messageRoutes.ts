import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getMessages, markMessagesRead, getUserPresence } from '../controllers/messageController.js';

const router = Router();

// Apply auth middleware to all message endpoints
router.use(authenticateToken);

// Message history & search
router.get('/:universeId', getMessages);

// Mark read
router.post('/:universeId/read', markMessagesRead);

// Presence query
router.get('/:universeId/presence/:targetUserId', getUserPresence);

export default router;
