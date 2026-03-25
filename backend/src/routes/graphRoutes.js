/**
 * Graph Routes
 * API endpoints for graph operations
 */

import express from 'express';
import * as graphController from '../controllers/graphController.js';

const router = express.Router();

// Graph statistics
router.get('/stats', graphController.getStats);

// Initial graph data for visualization
router.get('/initial', graphController.getInitialGraph);

// Node operations
router.get('/nodes', graphController.getNodes);
router.get('/nodes/:id', graphController.getNodeById);
router.get('/nodes/:id/expand', graphController.expandNode);

// Flow operations
router.get('/trace/:documentType/:documentId', graphController.traceFlow);
router.get('/broken-flows/:flowType', graphController.findBrokenFlows);

// Search
router.get('/search', graphController.searchNodes);

// Analytics
router.get('/analytics/top-products', graphController.getTopProducts);
router.get('/analytics/customer/:customerId', graphController.getCustomerStats);

export default router;
