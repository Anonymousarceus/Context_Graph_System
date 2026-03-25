/**
 * Graph Controller
 * Handles HTTP requests for graph operations
 */

import * as graphService from '../services/graphService.js';
import { logger } from '../utils/logger.js';

/**
 * Get graph statistics
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await graphService.getGraphStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Get initial graph data for visualization
 */
export const getInitialGraph = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await graphService.getInitialGraphData(limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all nodes with optional filtering
 */
export const getNodes = async (req, res, next) => {
  try {
    const { type, limit } = req.query;
    const nodes = await graphService.getAllNodes(type, parseInt(limit) || 100);
    res.json({ success: true, data: nodes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific node by ID
 */
export const getNodeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const node = await graphService.getNodeById(id);

    if (!node) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }

    res.json({ success: true, data: node });
  } catch (error) {
    next(error);
  }
};

/**
 * Expand a node to get its neighbors
 */
export const expandNode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { direction, limit } = req.query;

    const neighbors = await graphService.expandNode(
      id,
      direction || 'both',
      parseInt(limit) || 50
    );

    res.json({ success: true, data: neighbors });
  } catch (error) {
    next(error);
  }
};

/**
 * Trace document flow
 */
export const traceFlow = async (req, res, next) => {
  try {
    const { documentType, documentId } = req.params;
    const flow = await graphService.traceDocumentFlow(documentType, documentId);
    res.json({ success: true, data: flow });
  } catch (error) {
    next(error);
  }
};

/**
 * Find broken flows
 */
export const findBrokenFlows = async (req, res, next) => {
  try {
    const { flowType } = req.params;
    const results = await graphService.findBrokenFlows(flowType);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Search nodes
 */
export const searchNodes = async (req, res, next) => {
  try {
    const { q, type, limit } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }

    const results = await graphService.searchNodes(q, type, parseInt(limit) || 50);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Get top products by billing
 */
export const getTopProducts = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const products = await graphService.getTopProductsByBilling(parseInt(limit) || 10);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer statistics
 */
export const getCustomerStats = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const stats = await graphService.getCustomerStats(customerId);

    if (!stats) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export default {
  getStats,
  getInitialGraph,
  getNodes,
  getNodeById,
  expandNode,
  traceFlow,
  findBrokenFlows,
  searchNodes,
  getTopProducts,
  getCustomerStats
};
