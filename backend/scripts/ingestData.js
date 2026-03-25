/**
 * Data Ingestion Script
 * Loads SAP O2C data from JSONL files into MongoDB and creates graph structure
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// MongoDB connection
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
};

// Define schemas inline for the script
const nodeSchema = new mongoose.Schema({
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true },
  label: String,
  properties: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
nodeSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

const edgeSchema = new mongoose.Schema({
  sourceNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', index: true },
  targetNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', index: true },
  relationshipType: { type: String, index: true },
  properties: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const businessPartnerSchema = new mongoose.Schema({
  partnerId: { type: String, unique: true },
  customerId: String,
  name: String,
  fullName: String,
  category: String,
  grouping: String,
  createdBy: String,
  creationDate: Date,
  isBlocked: Boolean,
  rawData: mongoose.Schema.Types.Mixed
});

const productSchema = new mongoose.Schema({
  productId: { type: String, unique: true },
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

const salesOrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
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

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, unique: true },
  creationDate: Date,
  goodsMovementDate: Date,
  goodsMovementStatus: String,
  pickingStatus: String,
  shippingPoint: String,
  rawData: mongoose.Schema.Types.Mixed
});

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

const billingDocumentSchema = new mongoose.Schema({
  billingId: { type: String, unique: true },
  documentType: String,
  creationDate: Date,
  billingDate: Date,
  isCancelled: Boolean,
  totalNetAmount: Number,
  currency: String,
  companyCode: String,
  fiscalYear: String,
  accountingDocument: { type: String, index: true },
  soldToParty: { type: String, index: true },
  rawData: mongoose.Schema.Types.Mixed
});

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

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true },
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

// Create models
const Node = mongoose.model('Node', nodeSchema);
const Edge = mongoose.model('Edge', edgeSchema);
const BusinessPartner = mongoose.model('BusinessPartner', businessPartnerSchema);
const Product = mongoose.model('Product', productSchema);
const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
const SalesOrderItem = mongoose.model('SalesOrderItem', salesOrderItemSchema);
const Delivery = mongoose.model('Delivery', deliverySchema);
const DeliveryItem = mongoose.model('DeliveryItem', deliveryItemSchema);
const BillingDocument = mongoose.model('BillingDocument', billingDocumentSchema);
const BillingDocumentItem = mongoose.model('BillingDocumentItem', billingDocumentItemSchema);
const Payment = mongoose.model('Payment', paymentSchema);

const DATA_PATH = process.env.DATA_SOURCE_PATH || '../../sap-o2c-data';

/**
 * Read JSONL file and return array of objects
 */
async function readJsonlFile(filePath) {
  const records = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        records.push(JSON.parse(line));
      } catch (e) {
        console.warn(`Failed to parse line: ${line.substring(0, 50)}...`);
      }
    }
  }

  return records;
}

/**
 * Read all JSONL files from a directory
 */
async function readDirectory(dirPath) {
  const fullPath = path.resolve(process.cwd(), DATA_PATH, dirPath);
  console.log(`Reading directory: ${fullPath}`);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Directory not found: ${fullPath}`);
    return [];
  }

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.jsonl'));
  let allRecords = [];

  for (const file of files) {
    const records = await readJsonlFile(path.join(fullPath, file));
    allRecords = allRecords.concat(records);
  }

  console.log(`  Loaded ${allRecords.length} records from ${dirPath}`);
  return allRecords;
}

/**
 * Create a node and return its ID
 */
async function createNode(entityType, entityId, label, properties) {
  const node = await Node.findOneAndUpdate(
    { entityType, entityId },
    { entityType, entityId, label, properties },
    { upsert: true, new: true }
  );
  return node._id;
}

/**
 * Create an edge between nodes
 */
async function createEdge(sourceNodeId, targetNodeId, relationshipType, properties = {}) {
  await Edge.findOneAndUpdate(
    { sourceNodeId, targetNodeId, relationshipType },
    { sourceNodeId, targetNodeId, relationshipType, properties },
    { upsert: true }
  );
}

/**
 * Main ingestion function
 */
async function ingestData() {
  console.log('\n========================================');
  console.log('Starting Data Ingestion Process');
  console.log('========================================\n');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
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

    // 1. Load Business Partners (Customers)
    console.log('\n--- Loading Business Partners ---');
    const businessPartners = await readDirectory('business_partners');
    const customerNodeMap = new Map();

    for (const bp of businessPartners) {
      await BusinessPartner.create({
        partnerId: bp.businessPartner,
        customerId: bp.customer,
        name: bp.businessPartnerName,
        fullName: bp.businessPartnerFullName,
        category: bp.businessPartnerCategory,
        grouping: bp.businessPartnerGrouping,
        createdBy: bp.createdByUser,
        creationDate: bp.creationDate,
        isBlocked: bp.businessPartnerIsBlocked,
        rawData: bp
      });

      const nodeId = await createNode(
        'customer',
        bp.businessPartner,
        bp.businessPartnerName || bp.businessPartnerFullName,
        {
          customerId: bp.customer,
          category: bp.businessPartnerCategory,
          isBlocked: bp.businessPartnerIsBlocked,
          creationDate: bp.creationDate
        }
      );
      customerNodeMap.set(bp.businessPartner, nodeId);
    }
    console.log(`  Created ${customerNodeMap.size} customer nodes`);

    // 2. Load Addresses
    console.log('\n--- Loading Addresses ---');
    const addresses = await readDirectory('business_partner_addresses');

    for (const addr of addresses) {
      const nodeId = await createNode(
        'address',
        `${addr.businessPartner}_${addr.addressId}`,
        `${addr.cityName || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim() || 'Address',
        {
          city: addr.cityName,
          country: addr.country,
          region: addr.region,
          postalCode: addr.postalCode,
          street: addr.streetName
        }
      );

      const customerNodeId = customerNodeMap.get(addr.businessPartner);
      if (customerNodeId) {
        await createEdge(customerNodeId, nodeId, 'CUSTOMER_HAS_ADDRESS');
      }
    }

    // 3. Load Products
    console.log('\n--- Loading Products ---');
    const products = await readDirectory('products');
    const productDescriptions = await readDirectory('product_descriptions');
    const descriptionMap = new Map();

    for (const desc of productDescriptions) {
      descriptionMap.set(desc.product, desc.productDescription);
    }

    const productNodeMap = new Map();
    for (const prod of products) {
      const description = descriptionMap.get(prod.product) || prod.productOldId || prod.product;

      await Product.create({
        productId: prod.product,
        productType: prod.productType,
        description,
        grossWeight: parseFloat(prod.grossWeight) || 0,
        netWeight: parseFloat(prod.netWeight) || 0,
        weightUnit: prod.weightUnit,
        productGroup: prod.productGroup,
        baseUnit: prod.baseUnit,
        division: prod.division,
        rawData: prod
      });

      const nodeId = await createNode(
        'product',
        prod.product,
        description,
        {
          productType: prod.productType,
          productGroup: prod.productGroup,
          grossWeight: prod.grossWeight,
          netWeight: prod.netWeight
        }
      );
      productNodeMap.set(prod.product, nodeId);
    }
    console.log(`  Created ${productNodeMap.size} product nodes`);

    // 4. Load Sales Orders
    console.log('\n--- Loading Sales Orders ---');
    const salesOrders = await readDirectory('sales_order_headers');
    const salesOrderNodeMap = new Map();

    for (const so of salesOrders) {
      await SalesOrder.create({
        orderId: so.salesOrder,
        orderType: so.salesOrderType,
        salesOrganization: so.salesOrganization,
        distributionChannel: so.distributionChannel,
        soldToParty: so.soldToParty,
        creationDate: so.creationDate,
        createdBy: so.createdByUser,
        totalNetAmount: parseFloat(so.totalNetAmount) || 0,
        currency: so.transactionCurrency,
        deliveryStatus: so.overallDeliveryStatus,
        billingStatus: so.overallOrdReltdBillgStatus,
        rawData: so
      });

      const nodeId = await createNode(
        'sales_order',
        so.salesOrder,
        `Sales Order ${so.salesOrder}`,
        {
          orderType: so.salesOrderType,
          totalNetAmount: so.totalNetAmount,
          currency: so.transactionCurrency,
          creationDate: so.creationDate,
          deliveryStatus: so.overallDeliveryStatus
        }
      );
      salesOrderNodeMap.set(so.salesOrder, nodeId);

      const customerNodeId = customerNodeMap.get(so.soldToParty);
      if (customerNodeId) {
        await createEdge(customerNodeId, nodeId, 'CUSTOMER_PLACED_ORDER');
      }
    }
    console.log(`  Created ${salesOrderNodeMap.size} sales order nodes`);

    // 5. Load Sales Order Items
    console.log('\n--- Loading Sales Order Items ---');
    const salesOrderItems = await readDirectory('sales_order_items');

    for (const item of salesOrderItems) {
      await SalesOrderItem.create({
        salesOrderId: item.salesOrder,
        itemNumber: item.salesOrderItem,
        materialId: item.material,
        quantity: parseFloat(item.requestedQuantity) || 0,
        quantityUnit: item.requestedQuantityUnit,
        netAmount: parseFloat(item.netAmount) || 0,
        currency: item.transactionCurrency,
        plant: item.productionPlant,
        storageLocation: item.storageLocation,
        rawData: item
      });

      const orderNodeId = salesOrderNodeMap.get(item.salesOrder);
      const productNodeId = productNodeMap.get(item.material);
      if (orderNodeId && productNodeId) {
        await createEdge(orderNodeId, productNodeId, 'ORDER_CONTAINS_ITEM', {
          quantity: item.requestedQuantity,
          netAmount: item.netAmount
        });
      }
    }

    // 6. Load Deliveries
    console.log('\n--- Loading Deliveries ---');
    const deliveries = await readDirectory('outbound_delivery_headers');
    const deliveryNodeMap = new Map();

    for (const del of deliveries) {
      await Delivery.create({
        deliveryId: del.deliveryDocument,
        creationDate: del.creationDate,
        goodsMovementDate: del.actualGoodsMovementDate,
        goodsMovementStatus: del.overallGoodsMovementStatus,
        pickingStatus: del.overallPickingStatus,
        shippingPoint: del.shippingPoint,
        rawData: del
      });

      const nodeId = await createNode(
        'delivery',
        del.deliveryDocument,
        `Delivery ${del.deliveryDocument}`,
        {
          creationDate: del.creationDate,
          goodsMovementStatus: del.overallGoodsMovementStatus,
          pickingStatus: del.overallPickingStatus,
          shippingPoint: del.shippingPoint
        }
      );
      deliveryNodeMap.set(del.deliveryDocument, nodeId);
    }
    console.log(`  Created ${deliveryNodeMap.size} delivery nodes`);

    // 7. Load Delivery Items and create Order->Delivery edges
    console.log('\n--- Loading Delivery Items ---');
    const deliveryItems = await readDirectory('outbound_delivery_items');
    const orderDeliveryLinks = new Set();

    for (const item of deliveryItems) {
      await DeliveryItem.create({
        deliveryId: item.deliveryDocument,
        itemNumber: item.deliveryDocumentItem,
        salesOrderId: item.referenceSdDocument,
        salesOrderItem: item.referenceSdDocumentItem,
        quantity: parseFloat(item.actualDeliveryQuantity) || 0,
        quantityUnit: item.deliveryQuantityUnit,
        plant: item.plant,
        storageLocation: item.storageLocation,
        rawData: item
      });

      const linkKey = `${item.referenceSdDocument}_${item.deliveryDocument}`;
      if (!orderDeliveryLinks.has(linkKey)) {
        const orderNodeId = salesOrderNodeMap.get(item.referenceSdDocument);
        const deliveryNodeId = deliveryNodeMap.get(item.deliveryDocument);
        if (orderNodeId && deliveryNodeId) {
          await createEdge(orderNodeId, deliveryNodeId, 'ORDER_HAS_DELIVERY');
          orderDeliveryLinks.add(linkKey);
        }
      }
    }

    // 8. Load Billing Documents
    console.log('\n--- Loading Billing Documents ---');
    const billingDocs = await readDirectory('billing_document_headers');
    const billingNodeMap = new Map();

    for (const bd of billingDocs) {
      await BillingDocument.create({
        billingId: bd.billingDocument,
        documentType: bd.billingDocumentType,
        creationDate: bd.creationDate,
        billingDate: bd.billingDocumentDate,
        isCancelled: bd.billingDocumentIsCancelled,
        totalNetAmount: parseFloat(bd.totalNetAmount) || 0,
        currency: bd.transactionCurrency,
        companyCode: bd.companyCode,
        fiscalYear: bd.fiscalYear,
        accountingDocument: bd.accountingDocument,
        soldToParty: bd.soldToParty,
        rawData: bd
      });

      const nodeId = await createNode(
        'billing_document',
        bd.billingDocument,
        `Billing ${bd.billingDocument}`,
        {
          documentType: bd.billingDocumentType,
          totalNetAmount: bd.totalNetAmount,
          currency: bd.transactionCurrency,
          billingDate: bd.billingDocumentDate,
          isCancelled: bd.billingDocumentIsCancelled,
          accountingDocument: bd.accountingDocument
        }
      );
      billingNodeMap.set(bd.billingDocument, nodeId);
    }
    console.log(`  Created ${billingNodeMap.size} billing document nodes`);

    // 9. Load Billing Document Items and create Delivery->Billing edges
    console.log('\n--- Loading Billing Document Items ---');
    const billingItems = await readDirectory('billing_document_items');
    const deliveryBillingLinks = new Set();

    for (const item of billingItems) {
      await BillingDocumentItem.create({
        billingDocumentId: item.billingDocument,
        itemNumber: item.billingDocumentItem,
        materialId: item.material,
        quantity: parseFloat(item.billingQuantity) || 0,
        quantityUnit: item.billingQuantityUnit,
        netAmount: parseFloat(item.netAmount) || 0,
        currency: item.transactionCurrency,
        deliveryId: item.referenceSdDocument,
        deliveryItem: item.referenceSdDocumentItem,
        rawData: item
      });

      const linkKey = `${item.referenceSdDocument}_${item.billingDocument}`;
      if (!deliveryBillingLinks.has(linkKey)) {
        const deliveryNodeId = deliveryNodeMap.get(item.referenceSdDocument);
        const billingNodeId = billingNodeMap.get(item.billingDocument);
        if (deliveryNodeId && billingNodeId) {
          await createEdge(deliveryNodeId, billingNodeId, 'DELIVERY_GENERATED_BILLING');
          deliveryBillingLinks.add(linkKey);
        }
      }
    }

    // 10. Load Payments
    console.log('\n--- Loading Payments ---');
    const payments = await readDirectory('payments_accounts_receivable');
    const paymentNodeMap = new Map();

    for (const pay of payments) {
      const paymentId = `${pay.accountingDocument}_${pay.accountingDocumentItem}`;

      await Payment.create({
        paymentId,
        companyCode: pay.companyCode,
        fiscalYear: pay.fiscalYear,
        accountingDocument: pay.accountingDocument,
        accountingDocumentItem: pay.accountingDocumentItem,
        clearingDate: pay.clearingDate,
        clearingDocument: pay.clearingAccountingDocument,
        amount: parseFloat(pay.amountInTransactionCurrency) || 0,
        currency: pay.transactionCurrency,
        customerId: pay.customer,
        postingDate: pay.postingDate,
        rawData: pay
      });

      const nodeId = await createNode(
        'payment',
        paymentId,
        `Payment ${pay.accountingDocument}`,
        {
          amount: pay.amountInTransactionCurrency,
          currency: pay.transactionCurrency,
          clearingDate: pay.clearingDate,
          customerId: pay.customer
        }
      );
      paymentNodeMap.set(pay.accountingDocument, nodeId);

      // Find billing document with matching accounting document
      const billingDoc = await BillingDocument.findOne({
        accountingDocument: pay.accountingDocument
      });

      if (billingDoc) {
        const billingNodeId = billingNodeMap.get(billingDoc.billingId);
        if (billingNodeId) {
          await createEdge(billingNodeId, nodeId, 'BILLING_HAS_PAYMENT');
        }
      }
    }
    console.log(`  Created ${paymentNodeMap.size} payment nodes`);

    // Print summary
    console.log('\n========================================');
    console.log('Data Ingestion Complete!');
    console.log('========================================');

    const nodesByType = await Node.aggregate([
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\nNode Summary:');
    for (const row of nodesByType) {
      console.log(`  ${row._id}: ${row.count}`);
    }

    const edgesByType = await Edge.aggregate([
      { $group: { _id: '$relationshipType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('\nEdge Summary:');
    for (const row of edgesByType) {
      console.log(`  ${row._id}: ${row.count}`);
    }

    const totalNodes = await Node.countDocuments();
    const totalEdges = await Edge.countDocuments();
    console.log(`\nTotal: ${totalNodes} nodes, ${totalEdges} edges`);

  } catch (error) {
    console.error('Error during ingestion:', error);
    throw error;
  }
}

// Run ingestion
connectDB()
  .then(() => ingestData())
  .then(() => {
    console.log('\nIngestion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nIngestion failed:', error);
    process.exit(1);
  });
