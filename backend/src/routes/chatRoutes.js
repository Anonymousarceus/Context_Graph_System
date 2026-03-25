/**
 * Chat Routes
 * API endpoints for chat and query operations
 */

import express from 'express';
import * as chatController from '../controllers/chatController.js';

const router = express.Router();

// Process natural language query
router.post('/query', chatController.processQuery);

// Conversation history
router.get('/history/:sessionId', chatController.getHistory);
router.delete('/history/:sessionId', chatController.clearHistory);

// Query suggestions
router.get('/suggestions', chatController.getSuggestions);

export default router;
