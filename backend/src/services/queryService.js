/**
 * Query Service
 * Orchestrates query execution combining LLM and Graph services
 * MongoDB Implementation
 */

import { Conversation } from '../config/database.js';
import * as graphService from './graphService.js';
import * as llmService from './llmService.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process a natural language query
 */
export const processQuery = async (userQuery, sessionId) => {
  const startTime = Date.now();

  // Check domain relevance
  if (!llmService.isDomainRelevant(userQuery)) {
    return {
      success: false,
      response: 'This system is designed to answer questions related to the provided dataset only. Please ask questions about orders, deliveries, billing documents, payments, customers, or products.',
      isOffTopic: true
    };
  }

  try {
    // Parse intent using LLM
    const intent = await llmService.parseIntent(userQuery);
    logger.info('Query intent parsed', { intent: intent.intent });

    let results;
    let relevantNodes = [];

    // Execute based on intent
    switch (intent.intent) {
      case 'trace_flow':
        results = await graphService.traceDocumentFlow(
          intent.entities.document_type,
          intent.entities.document_id
        );
        relevantNodes = results.nodes?.map(n => n.id) || [];
        break;

      case 'find_broken_flows':
        results = await graphService.findBrokenFlows(intent.entities.flow_type);
        relevantNodes = results.map(n => n.id);
        break;

      case 'top_products':
        results = await graphService.getTopProductsByBilling(intent.entities.limit || 10);
        break;

      case 'customer_stats':
        results = await graphService.getCustomerStats(intent.entities.customer_id);
        break;

      case 'search_entity':
        results = await graphService.searchNodes(
          intent.entities.search_term,
          intent.entities.document_type,
          intent.entities.limit || 20
        );
        relevantNodes = results.map(n => n.id);
        break;

      case 'aggregate_query':
      case 'general_query':
        // For MongoDB, we'll use graph search instead of SQL
        results = await graphService.searchNodes(userQuery, null, 20);
        break;

      default:
        results = await graphService.searchNodes(userQuery, null, 20);
    }

    // Generate natural language response
    const response = await llmService.generateResponse(userQuery, results, intent);

    // Generate query explanation
    const queryExplanation = await llmService.explainQuery(intent.sql_query, intent);

    // Store conversation history
    await storeConversation(sessionId, 'user', userQuery, intent.intent, relevantNodes);
    await storeConversation(sessionId, 'assistant', response, intent.intent, relevantNodes);

    const duration = Date.now() - startTime;
    logger.info('Query processed', { duration, intent: intent.intent });

    return {
      success: true,
      response,
      data: results,
      intent: intent.intent,
      explanation: intent.explanation,
      queryExplanation,
      relevantNodes,
      duration
    };

  } catch (error) {
    logger.error('Query processing error', { error: error.message });
    return {
      success: false,
      response: 'I encountered an error processing your question. Please try rephrasing it.',
      error: error.message
    };
  }
};

/**
 * Store conversation in history
 */
const storeConversation = async (sessionId, role, content, queryType, relevantNodes) => {
  try {
    await Conversation.create({
      sessionId: sessionId || uuidv4(),
      role,
      content,
      queryType,
      relevantNodes
    });
  } catch (error) {
    logger.warn('Failed to store conversation', { error: error.message });
  }
};

/**
 * Get conversation history for a session
 */
export const getConversationHistory = async (sessionId, limit = 20) => {
  const conversations = await Conversation.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Reverse to get chronological order and transform
  return conversations.reverse().map(c => ({
    role: c.role,
    content: c.content,
    query_type: c.queryType,
    relevant_nodes: c.relevantNodes,
    created_at: c.createdAt
  }));
};

/**
 * Clear conversation history for a session
 */
export const clearConversationHistory = async (sessionId) => {
  await Conversation.deleteMany({ sessionId });
  return { success: true };
};

/**
 * Get suggested queries based on data
 */
export const getSuggestedQueries = async () => {
  return [
    {
      category: 'Flow Analysis',
      queries: [
        'Trace the full flow of billing document 90504248',
        'Show the O2C process for sales order 740506',
        'What happened to delivery 80737721?'
      ]
    },
    {
      category: 'Anomaly Detection',
      queries: [
        'Find all deliveries that were not billed',
        'Show billing documents without associated deliveries',
        'Which billing documents are unpaid?'
      ]
    },
    {
      category: 'Analytics',
      queries: [
        'Which products have the highest billing amounts?',
        'Show top 10 customers by order value',
        'How many orders were placed in April 2025?'
      ]
    },
    {
      category: 'Entity Lookup',
      queries: [
        'Find customer 320000083',
        'Search for product B8907367041603',
        'Show all billing documents for customer 320000082'
      ]
    }
  ];
};

export default {
  processQuery,
  getConversationHistory,
  clearConversationHistory,
  getSuggestedQueries
};
