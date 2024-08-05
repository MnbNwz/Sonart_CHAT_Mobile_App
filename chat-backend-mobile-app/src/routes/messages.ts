import express from 'express';
import { getConversations, getMessages, sendMessage, SaveGroupMessage,getGroupConversations } from '../controllers/MessagesController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getConversations); // get all convos
router.get('/getgroups', authenticate, getGroupConversations); // get all convos

router.get('/:id', authenticate, getMessages); // get specific convo

router.post('/create', authenticate, sendMessage); // send message
router.post('/groupInfo', authenticate, SaveGroupMessage); // Group Info


export default router;
