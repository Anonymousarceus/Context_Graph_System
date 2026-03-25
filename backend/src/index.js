/**
 * Context Graph Query System - Backend Entry Point
 * Express server with graph and chat APIs
 * MongoDB Implementation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './utils/logger.js';
import { connectDatabase, checkHealth } from './config/database.js';
import graphRoutes from './routes/graphRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateJsonBody
} from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// JSON validation
app.use(validateJsonBody);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await checkHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/graph', graphRoutes);
app.use('/api/chat', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Context Graph Query System API',
    version: '1.0.0',
    database: 'MongoDB',
    endpoints: {
      health: '/health',
      graph: '/api/graph',
      chat: '/api/chat'
    },
    documentation: '/api/docs'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Context Graph Query System API Documentation',
    version: '1.0.0',
    database: 'MongoDB',
    endpoints: {
      graph: {
        'GET /api/graph/stats': 'Get graph statistics',
        'GET /api/graph/initial': 'Get initial graph data for visualization',
        'GET /api/graph/nodes': 'Get all nodes (optional: ?type=sales_order&limit=100)',
        'GET /api/graph/nodes/:id': 'Get node by ID with relationships',
        'GET /api/graph/nodes/:id/expand': 'Expand node to get neighbors',
        'GET /api/graph/trace/:documentType/:documentId': 'Trace document flow',
        'GET /api/graph/broken-flows/:flowType': 'Find broken flows (delivered_not_billed, billed_without_delivery, billed_not_paid)',
        'GET /api/graph/search': 'Search nodes (?q=searchTerm&type=optional)',
        'GET /api/graph/analytics/top-products': 'Get top products by billing',
        'GET /api/graph/analytics/customer/:customerId': 'Get customer statistics'
      },
      chat: {
        'POST /api/chat/query': 'Process natural language query (body: { query: string, sessionId?: string })',
        'GET /api/chat/history/:sessionId': 'Get conversation history',
        'DELETE /api/chat/history/:sessionId': 'Clear conversation history',
        'GET /api/chat/suggestions': 'Get suggested queries'
      }
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server with database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connection established');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();

export default app;
