/**
 * Graph Service
 * Handles all graph-related operations including traversals and queries
 * MongoDB Implementation
 */

import {
  Node,
  Edge,
  SalesOrder,
  BillingDocument,
  BillingDocumentItem,
  DeliveryItem
} from '../config/database.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Get all nodes with optional filtering
 */
export const getAllNodes = async (entityType = null, limit = 100) => {
  const query = entityType ? { entityType } : {};
  const nodes = await Node.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return nodes.map(n => ({
    id: n._id.toString(),
    entity_type: n.entityType,
    entity_id: n.entityId,
    label: n.label,
    properties: n.properties
  }));
};

/**
 * Get node by ID with its relationships
 */
export const getNodeById = async (nodeId) => {
  if (!mongoose.Types.ObjectId.isValid(nodeId)) {
    return null;
  }

  const node = await Node.findById(nodeId).lean();
  if (!node) {
    return null;
  }

  // Get outgoing relationships
  const outgoingEdges = await Edge.find({ sourceNodeId: nodeId }).lean();
  const outgoingTargetIds = outgoingEdges.map(e => e.targetNodeId);
  const outgoingTargets = await Node.find({ _id: { $in: outgoingTargetIds } }).lean();
  const targetMap = new Map(outgoingTargets.map(n => [n._id.toString(), n]));

  const outgoingRelationships = outgoingEdges.map(e => {
    const target = targetMap.get(e.targetNodeId.toString());
    return {
      id: e._id.toString(),
      relationship_type: e.relationshipType,
      properties: e.properties,
      target_id: e.targetNodeId.toString(),
      target_type: target?.entityType,
      target_entity_id: target?.entityId,
      target_label: target?.label
    };
  });

  // Get incoming relationships
  const incomingEdges = await Edge.find({ targetNodeId: nodeId }).lean();
  const incomingSourceIds = incomingEdges.map(e => e.sourceNodeId);
  const incomingSources = await Node.find({ _id: { $in: incomingSourceIds } }).lean();
  const sourceMap = new Map(incomingSources.map(n => [n._id.toString(), n]));

  const incomingRelationships = incomingEdges.map(e => {
    const source = sourceMap.get(e.sourceNodeId.toString());
    return {
      id: e._id.toString(),
      relationship_type: e.relationshipType,
      properties: e.properties,
      source_id: e.sourceNodeId.toString(),
      source_type: source?.entityType,
      source_entity_id: source?.entityId,
      source_label: source?.label
    };
  });

  return {
    id: node._id.toString(),
    entity_type: node.entityType,
    entity_id: node.entityId,
    label: node.label,
    properties: node.properties,
    outgoingRelationships,
    incomingRelationships
  };
};

/**
 * Get node by entity type and entity ID
 */
export const getNodeByEntity = async (entityType, entityId) => {
  const node = await Node.findOne({ entityType, entityId }).lean();
  if (!node) return null;

  return {
    id: node._id.toString(),
    entity_type: node.entityType,
    entity_id: node.entityId,
    label: node.label,
    properties: node.properties
  };
};

/**
 * Expand node - get immediate neighbors
 */
export const expandNode = async (nodeId, direction = 'both', limit = 50) => {
  if (!mongoose.Types.ObjectId.isValid(nodeId)) {
    return [];
  }

  const results = [];

  if (direction === 'outgoing' || direction === 'both') {
    const outgoingEdges = await Edge.find({ sourceNodeId: nodeId }).limit(limit).lean();
    const targetIds = outgoingEdges.map(e => e.targetNodeId);
    const targets = await Node.find({ _id: { $in: targetIds } }).lean();
    const targetMap = new Map(targets.map(n => [n._id.toString(), n]));

    outgoingEdges.forEach(e => {
      const target = targetMap.get(e.targetNodeId.toString());
      if (target) {
        results.push({
          id: target._id.toString(),
          entity_type: target.entityType,
          entity_id: target.entityId,
          label: target.label,
          properties: target.properties,
          relationship_type: e.relationshipType,
          direction: 'outgoing'
        });
      }
    });
  }

  if (direction === 'incoming' || direction === 'both') {
    const incomingEdges = await Edge.find({ targetNodeId: nodeId }).limit(limit).lean();
    const sourceIds = incomingEdges.map(e => e.sourceNodeId);
    const sources = await Node.find({ _id: { $in: sourceIds } }).lean();
    const sourceMap = new Map(sources.map(n => [n._id.toString(), n]));

    incomingEdges.forEach(e => {
      const source = sourceMap.get(e.sourceNodeId.toString());
      if (source) {
        results.push({
          id: source._id.toString(),
          entity_type: source.entityType,
          entity_id: source.entityId,
          label: source.label,
          properties: source.properties,
          relationship_type: e.relationshipType,
          direction: 'incoming'
        });
      }
    });
  }

  return results.slice(0, limit);
};

/**
 * Get edges between nodes
 */
export const getEdgesBetweenNodes = async (nodeIds) => {
  if (!nodeIds || nodeIds.length === 0) return [];

  const objectIds = nodeIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (objectIds.length === 0) return [];

  const edges = await Edge.find({
    sourceNodeId: { $in: objectIds },
    targetNodeId: { $in: objectIds }
  }).lean();

  return edges.map(e => ({
    id: e._id.toString(),
    source_node_id: e.sourceNodeId.toString(),
    target_node_id: e.targetNodeId.toString(),
    relationship_type: e.relationshipType,
    properties: e.properties
  }));
};

/**
 * Trace document flow - traverses the O2C process
 * Sales Order -> Delivery -> Billing -> Payment
 */
export const traceDocumentFlow = async (documentType, documentId) => {
  logger.info(`Tracing document flow for ${documentType}: ${documentId}`);

  const result = {
    nodes: [],
    edges: [],
    path: []
  };

  // Get starting node
  const startNode = await getNodeByEntity(documentType, documentId);
  if (!startNode) {
    return result;
  }

  // BFS traversal to trace the flow
  const visited = new Set();
  const queue = [startNode.id];
  const allNodes = [startNode];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Get outgoing edges
    const outgoingEdges = await Edge.find({ sourceNodeId: currentId }).lean();
    for (const edge of outgoingEdges) {
      const targetId = edge.targetNodeId.toString();
      if (!visited.has(targetId)) {
        const targetNode = await Node.findById(targetId).lean();
        if (targetNode) {
          allNodes.push({
            id: targetNode._id.toString(),
            entity_type: targetNode.entityType,
            entity_id: targetNode.entityId,
            label: targetNode.label,
            properties: targetNode.properties
          });
          queue.push(targetId);
        }
      }
    }

    // Also check incoming edges (for reverse traversal)
    const incomingEdges = await Edge.find({ targetNodeId: currentId }).lean();
    for (const edge of incomingEdges) {
      const sourceId = edge.sourceNodeId.toString();
      if (!visited.has(sourceId)) {
        const sourceNode = await Node.findById(sourceId).lean();
        if (sourceNode) {
          allNodes.push({
            id: sourceNode._id.toString(),
            entity_type: sourceNode.entityType,
            entity_id: sourceNode.entityId,
            label: sourceNode.label,
            properties: sourceNode.properties
          });
          queue.push(sourceId);
        }
      }
    }
  }

  result.nodes = allNodes;
  result.edges = await getEdgesBetweenNodes(allNodes.map(n => n.id));
  result.path = allNodes.map(n => ({
    type: n.entity_type,
    id: n.entity_id,
    label: n.label
  }));

  return result;
};

/**
 * Find broken flows - deliveries without billing or billing without delivery
 */
export const findBrokenFlows = async (flowType) => {
  if (flowType === 'delivered_not_billed') {
    // Find delivery nodes without outgoing edges to billing_document
    const deliveryNodes = await Node.find({ entityType: 'delivery' }).lean();
    const results = [];

    for (const node of deliveryNodes) {
      const hasBilling = await Edge.findOne({
        sourceNodeId: node._id,
        relationshipType: 'DELIVERY_GENERATED_BILLING'
      });

      if (!hasBilling) {
        results.push({
          id: node._id.toString(),
          delivery_id: node.entityId,
          label: node.label,
          properties: node.properties
        });
      }
    }
    return results;

  } else if (flowType === 'billed_without_delivery') {
    // Find billing nodes without incoming edges from delivery
    const billingNodes = await Node.find({ entityType: 'billing_document' }).lean();
    const results = [];

    for (const node of billingNodes) {
      const hasDelivery = await Edge.findOne({
        targetNodeId: node._id,
        relationshipType: 'DELIVERY_GENERATED_BILLING'
      });

      if (!hasDelivery) {
        results.push({
          id: node._id.toString(),
          billing_id: node.entityId,
          label: node.label,
          properties: node.properties
        });
      }
    }
    return results;

  } else if (flowType === 'billed_not_paid') {
    // Find billing nodes without outgoing edges to payment
    const billingNodes = await Node.find({ entityType: 'billing_document' }).lean();
    const results = [];

    for (const node of billingNodes) {
      const hasPayment = await Edge.findOne({
        sourceNodeId: node._id,
        relationshipType: 'BILLING_HAS_PAYMENT'
      });

      if (!hasPayment) {
        results.push({
          id: node._id.toString(),
          billing_id: node.entityId,
          label: node.label,
          properties: node.properties
        });
      }
    }
    return results;
  }

  return [];
};

/**
 * Get graph statistics
 */
export const getGraphStats = async () => {
  const stats = {};

  // Node counts by type
  const nodesByType = await Node.aggregate([
    { $group: { _id: '$entityType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  stats.nodesByType = nodesByType.map(n => ({
    entity_type: n._id,
    count: n.count.toString()
  }));

  // Total nodes and edges
  stats.totalNodes = await Node.countDocuments();
  stats.totalEdges = await Edge.countDocuments();

  // Edge counts by type
  const edgesByType = await Edge.aggregate([
    { $group: { _id: '$relationshipType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  stats.edgesByType = edgesByType.map(e => ({
    relationship_type: e._id,
    count: e.count.toString()
  }));

  return stats;
};

/**
 * Search nodes by label or properties
 */
export const searchNodes = async (searchTerm, entityType = null, limit = 50) => {
  const regex = new RegExp(searchTerm, 'i');

  const query = {
    $or: [
      { label: regex },
      { entityId: regex }
    ]
  };

  if (entityType) {
    query.entityType = entityType;
  }

  const nodes = await Node.find(query)
    .limit(limit)
    .sort({ label: 1 })
    .lean();

  return nodes.map(n => ({
    id: n._id.toString(),
    entity_type: n.entityType,
    entity_id: n.entityId,
    label: n.label,
    properties: n.properties
  }));
};

/**
 * Get products with highest billing amounts
 */
export const getTopProductsByBilling = async (limit = 10) => {
  // Aggregate billing document items by material
  const billingStats = await BillingDocumentItem.aggregate([
    {
      $group: {
        _id: '$materialId',
        billing_count: { $sum: 1 },
        total_amount: { $sum: { $toDouble: '$netAmount' } }
      }
    },
    { $sort: { billing_count: -1, total_amount: -1 } },
    { $limit: limit }
  ]);

  // Get product nodes for these materials
  const materialIds = billingStats.map(s => s._id);
  const productNodes = await Node.find({
    entityType: 'product',
    entityId: { $in: materialIds }
  }).lean();

  const productMap = new Map(productNodes.map(p => [p.entityId, p]));

  return billingStats.map(s => {
    const product = productMap.get(s._id);
    return {
      product_id: s._id,
      product_name: product?.label || s._id,
      properties: product?.properties || {},
      billing_count: s.billing_count.toString(),
      total_amount: s.total_amount.toFixed(2)
    };
  });
};

/**
 * Get customer order statistics
 */
export const getCustomerStats = async (customerId) => {
  const stats = {};

  // Get customer node
  const customerNode = await getNodeByEntity('customer', customerId);
  if (!customerNode) {
    return null;
  }

  // Count orders
  const orders = await SalesOrder.find({ soldToParty: customerId });
  const orderTotal = orders.reduce((sum, o) => sum + (parseFloat(o.totalNetAmount) || 0), 0);
  stats.orders = {
    count: orders.length.toString(),
    total: orderTotal.toFixed(2)
  };

  // Count deliveries through order items
  const orderIds = orders.map(o => o.orderId);
  const deliveryItems = await DeliveryItem.find({ salesOrderId: { $in: orderIds } });
  const uniqueDeliveries = new Set(deliveryItems.map(d => d.deliveryId));
  stats.deliveries = {
    count: uniqueDeliveries.size.toString()
  };

  // Count billing documents
  const billingDocs = await BillingDocument.find({ soldToParty: customerId });
  const billingTotal = billingDocs.reduce((sum, b) => sum + (parseFloat(b.totalNetAmount) || 0), 0);
  stats.billing = {
    count: billingDocs.length.toString(),
    total: billingTotal.toFixed(2)
  };

  return { customer: customerNode, stats };
};

/**
 * Get initial graph data for visualization
 */
export const getInitialGraphData = async (limit = 50) => {
  // Get a sample of nodes from each type
  const entityTypes = ['customer', 'sales_order', 'delivery', 'billing_document', 'payment', 'product'];
  const nodesPerType = Math.ceil(limit / entityTypes.length);

  const allNodes = [];

  for (const type of entityTypes) {
    const nodes = await Node.find({ entityType: type })
      .sort({ createdAt: -1 })
      .limit(nodesPerType)
      .lean();

    nodes.forEach(n => {
      allNodes.push({
        id: n._id.toString(),
        entity_type: n.entityType,
        entity_id: n.entityId,
        label: n.label,
        properties: n.properties
      });
    });
  }

  // Get edges between these nodes
  const nodeIds = allNodes.map(n => n.id);
  const edges = await getEdgesBetweenNodes(nodeIds);

  return { nodes: allNodes.slice(0, limit), edges };
};

export default {
  getAllNodes,
  getNodeById,
  getNodeByEntity,
  expandNode,
  getEdgesBetweenNodes,
  traceDocumentFlow,
  findBrokenFlows,
  getGraphStats,
  searchNodes,
  getTopProductsByBilling,
  getCustomerStats,
  getInitialGraphData
};
