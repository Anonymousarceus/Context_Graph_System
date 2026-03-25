/**
 * MongoDB Database Configuration
 * Handles connection and model definitions for graph data
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// Connect to MongoDB
export const connectDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(uri, {
      maxPoolSize: 20,
    });

    logger.info('Connected to MongoDB successfully');
    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection error', { error: error.message });
    throw error;
  }
};

// Node Schema - represents graph vertices
const nodeSchema = new mongoose.Schema({
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true },
  label: { type: String },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

nodeSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
nodeSchema.index({ label: 'text', entityId: 'text' });

// Edge Schema - represents graph relationships
const edgeSchema = new mongoose.Schema({
  sourceNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true, index: true },
  targetNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true, index: true },
  relationshipType: { type: String, required: true, index: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

edgeSchema.index({ sourceNodeId: 1, targetNodeId: 1, relationshipType: 1 });

// Business Partner Schema
const businessPartnerSchema = new mongoose.Schema({
  partnerId: { type: String, required: true, unique: true },
  customerId: String,
  name: String,
  fullName: String,
  category: String,
  grouping: String,
  createdBy: String,
  creationDate: Date,
  isBlocked: { type: Boolean, default: false },
  rawData: mongoose.Schema.Types.Mixed
});

// Product Schema
const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  productType: String,
  description: String,
  grossWeight: Number,
  netWeight: Number,
  weightUnit: String,
  productGroup: String,
  baseUnit: String,
  division: String,
  rawData: mongoose.Schema.Types.Mixed
});

// Sales Order Schema
const salesOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  orderType: String,
  salesOrganization: String,
  distributionChannel: String,
  soldToParty: { type: String, index: true },
  creationDate: Date,
  createdBy: String,
  totalNetAmount: Number,
  currency: String,
  deliveryStatus: String,
  billingStatus: String,
  rawData: mongoose.Schema.Types.Mixed
});

// Sales Order Item Schema
const salesOrderItemSchema = new mongoose.Schema({
  salesOrderId: { type: String, index: true },
  itemNumber: String,
  materialId: { type: String, index: true },
  quantity: Number,
  quantityUnit: String,
  netAmount: Number,
  currency: String,
  plant: String,
  storageLocation: String,
  rawData: mongoose.Schema.Types.Mixed
});

// Delivery Schema
const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  creationDate: Date,
  goodsMovementDate: Date,
  goodsMovementStatus: String,
  pickingStatus: String,
  shippingPoint: String,
  rawData: mongoose.Schema.Types.Mixed
});

// Delivery Item Schema
const deliveryItemSchema = new mongoose.Schema({
  deliveryId: { type: String, index: true },
  itemNumber: String,
  salesOrderId: { type: String, index: true },
  salesOrderItem: String,
  quantity: Number,
  quantityUnit: String,
  plant: String,
  storageLocation: String,
  rawData: mongoose.Schema.Types.Mixed
});

// Billing Document Schema
const billingDocumentSchema = new mongoose.Schema({
  billingId: { type: String, required: true, unique: true },
  documentType: String,
  creationDate: Date,
  billingDate: Date,
  isCancelled: { type: Boolean, default: false },
  totalNetAmount: Number,
  currency: String,
  companyCode: String,
  fiscalYear: String,
  accountingDocument: { type: String, index: true },
  soldToParty: { type: String, index: true },
  rawData: mongoose.Schema.Types.Mixed
});

// Billing Document Item Schema
const billingDocumentItemSchema = new mongoose.Schema({
  billingDocumentId: { type: String, index: true },
  itemNumber: String,
  materialId: { type: String, index: true },
  quantity: Number,
  quantityUnit: String,
  netAmount: Number,
  currency: String,
  deliveryId: { type: String, index: true },
  deliveryItem: String,
  rawData: mongoose.Schema.Types.Mixed
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  companyCode: String,
  fiscalYear: String,
  accountingDocument: { type: String, index: true },
  accountingDocumentItem: String,
  clearingDate: Date,
  clearingDocument: String,
  amount: Number,
  currency: String,
  customerId: { type: String, index: true },
  postingDate: Date,
  rawData: mongoose.Schema.Types.Mixed
});

// Conversation History Schema
const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  queryType: String,
  relevantNodes: [mongoose.Schema.Types.ObjectId],
  createdAt: { type: Date, default: Date.now }
});

// Export models
export const Node = mongoose.model('Node', nodeSchema);
export const Edge = mongoose.model('Edge', edgeSchema);
export const BusinessPartner = mongoose.model('BusinessPartner', businessPartnerSchema);
export const Product = mongoose.model('Product', productSchema);
export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
export const SalesOrderItem = mongoose.model('SalesOrderItem', salesOrderItemSchema);
export const Delivery = mongoose.model('Delivery', deliverySchema);
export const DeliveryItem = mongoose.model('DeliveryItem', deliveryItemSchema);
export const BillingDocument = mongoose.model('BillingDocument', billingDocumentSchema);
export const BillingDocumentItem = mongoose.model('BillingDocumentItem', billingDocumentItemSchema);
export const Payment = mongoose.model('Payment', paymentSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);

/**
 * Initialize database - create indexes
 */
export const initializeDatabase = async () => {
  logger.info('Initializing database indexes...');

  try {
    await Node.createIndexes();
    await Edge.createIndexes();
    await BusinessPartner.createIndexes();
    await Product.createIndexes();
    await SalesOrder.createIndexes();
    await SalesOrderItem.createIndexes();
    await Delivery.createIndexes();
    await DeliveryItem.createIndexes();
    await BillingDocument.createIndexes();
    await BillingDocumentItem.createIndexes();
    await Payment.createIndexes();
    await Conversation.createIndexes();

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create indexes', { error: error.message });
    throw error;
  }
};

/**
 * Check database connection health
 */
export const checkHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    if (state === 1) {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    }
    return { status: 'unhealthy', state };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

/**
 * Clear all collections
 */
export const clearDatabase = async () => {
  await Node.deleteMany({});
  await Edge.deleteMany({});
  await BusinessPartner.deleteMany({});
  await Product.deleteMany({});
  await SalesOrder.deleteMany({});
  await SalesOrderItem.deleteMany({});
  await Delivery.deleteMany({});
  await DeliveryItem.deleteMany({});
  await BillingDocument.deleteMany({});
  await BillingDocumentItem.deleteMany({});
  await Payment.deleteMany({});
  await Conversation.deleteMany({});
  logger.info('Database cleared');
};

export default {
  connectDatabase,
  initializeDatabase,
  checkHealth,
  clearDatabase,
  Node,
  Edge,
  BusinessPartner,
  Product,
  SalesOrder,
  SalesOrderItem,
  Delivery,
  DeliveryItem,
  BillingDocument,
  BillingDocumentItem,
  Payment,
  Conversation
};
