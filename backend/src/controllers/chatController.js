/**
 * Chat Controller
 * Handles HTTP requests for chat and query operations
 */

import * as queryService from '../services/queryService.js';
import { logger } from '../utils/logger.js';

/**
 * Process a natural language query
 */
export const processQuery = async (req, res, next) => {
  try {
    const { query, sessionId } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }

    if (query.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Query is too long. Maximum 1000 characters allowed.'
      });
    }

    const result = await queryService.processQuery(query, sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation history
 */
export const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { limit } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const history = await queryService.getConversationHistory(
      sessionId,
      parseInt(limit) || 20
    );

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear conversation history
 */
export const clearHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    await queryService.clearConversationHistory(sessionId);
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get suggested queries
 */
export const getSuggestions = async (req, res, next) => {
  try {
    const suggestions = await queryService.getSuggestedQueries();
    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

export default {
  processQuery,
  getHistory,
  clearHistory,
  getSuggestions
};
