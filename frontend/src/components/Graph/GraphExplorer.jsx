/**
 * Graph Explorer Component
 * Main graph visualization using React Flow
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode from './CustomNode';
import { expandNode } from '../../services/api';
import toast from 'react-hot-toast';

// Node type colors
const nodeColors = {
  customer: '#9333ea',
  sales_order: '#3b82f6',
  delivery: '#22c55e',
  billing_document: '#f59e0b',
  payment: '#10b981',
  product: '#ec4899',
  address: '#06b6d4',
};

// Edge colors by relationship type
const edgeColors = {
  CUSTOMER_PLACED_ORDER: '#9333ea',
  ORDER_CONTAINS_ITEM: '#3b82f6',
  ORDER_HAS_DELIVERY: '#22c55e',
  DELIVERY_GENERATED_BILLING: '#f59e0b',
  BILLING_HAS_PAYMENT: '#10b981',
  CUSTOMER_HAS_ADDRESS: '#06b6d4',
};

// Custom node types
const nodeTypes = {
  custom: CustomNode,
};

/**
 * Convert API data to React Flow format
 */
function transformData(data, highlightedNodes = []) {
  const highlightSet = new Set(highlightedNodes);

  // Create a map for node positions (simple grid layout)
  const typeGroups = {};
  data.nodes.forEach(node => {
    const type = node.entity_type;
    if (!typeGroups[type]) typeGroups[type] = [];
    typeGroups[type].push(node);
  });

  // Position nodes in groups
  const typeOrder = ['customer', 'sales_order', 'delivery', 'billing_document', 'payment', 'product', 'address'];
  const positionedNodes = [];
  let xOffset = 0;

  typeOrder.forEach(type => {
    const group = typeGroups[type] || [];
    group.forEach((node, idx) => {
      positionedNodes.push({
        id: node.id,
        type: 'custom',
        position: {
          x: xOffset + (Math.random() * 100 - 50),
          y: idx * 120 + (Math.random() * 40 - 20)
        },
        data: {
          label: node.label || node.entity_id,
          entityType: node.entity_type,
          entityId: node.entity_id,
          properties: node.properties,
          color: nodeColors[node.entity_type] || '#64748b',
          isHighlighted: highlightSet.has(node.id),
        },
      });
    });
    if (group.length > 0) xOffset += 350;
  });

  // Handle any remaining types
  Object.keys(typeGroups).forEach(type => {
    if (!typeOrder.includes(type)) {
      const group = typeGroups[type];
      group.forEach((node, idx) => {
        positionedNodes.push({
          id: node.id,
          type: 'custom',
          position: {
            x: xOffset + (Math.random() * 100 - 50),
            y: idx * 120 + (Math.random() * 40 - 20)
          },
          data: {
            label: node.label || node.entity_id,
            entityType: node.entity_type,
            entityId: node.entity_id,
            properties: node.properties,
            color: nodeColors[node.entity_type] || '#64748b',
            isHighlighted: highlightSet.has(node.id),
          },
        });
      });
      xOffset += 350;
    }
  });

  // Transform edges
  const edges = data.edges.map(edge => ({
    id: edge.id,
    source: edge.source_node_id,
    target: edge.target_node_id,
    label: edge.relationship_type?.replace(/_/g, ' '),
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: edgeColors[edge.relationship_type] || '#94a3b8',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeColors[edge.relationship_type] || '#94a3b8',
    },
    labelStyle: {
      fontSize: 10,
      fontWeight: 500,
      fill: '#64748b',
    },
    labelBgStyle: {
      fill: 'white',
      fillOpacity: 0.9,
    },
  }));

  return { nodes: positionedNodes, edges };
}

function GraphExplorer({ initialData, onNodeSelect, onNodeExpand, highlightedNodes }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isExpanding, setIsExpanding] = useState(false);

  // Transform initial data
  useEffect(() => {
    if (initialData?.nodes?.length > 0) {
      const { nodes: flowNodes, edges: flowEdges } = transformData(initialData, highlightedNodes);
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [initialData, highlightedNodes, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    onNodeSelect({
      id: node.id,
      entity_type: node.data.entityType,
      entity_id: node.data.entityId,
      label: node.data.label,
      properties: node.data.properties,
    });
  }, [onNodeSelect]);

  // Handle node double-click (expand)
  const onNodeDoubleClick = useCallback(async (event, node) => {
    if (isExpanding) return;

    setIsExpanding(true);
    toast.loading('Expanding node...', { id: 'expand' });

    try {
      const result = await expandNode(node.id, 'both', 20);

      if (result.success && result.data.length > 0) {
        // Transform new nodes
        const newNodeIds = new Set(result.data.map(n => n.id));
        const existingNodeIds = new Set(nodes.map(n => n.id));

        // Filter out existing nodes
        const newNodes = result.data.filter(n => !existingNodeIds.has(n.id));

        if (newNodes.length > 0) {
          // Get the position of the clicked node
          const clickedNode = nodes.find(n => n.id === node.id);
          const baseX = clickedNode?.position?.x || 0;
          const baseY = clickedNode?.position?.y || 0;

          // Create new flow nodes positioned around the clicked node
          const flowNodes = newNodes.map((n, idx) => {
            const angle = (idx / newNodes.length) * 2 * Math.PI;
            const radius = 200;
            return {
              id: n.id,
              type: 'custom',
              position: {
                x: baseX + Math.cos(angle) * radius,
                y: baseY + Math.sin(angle) * radius,
              },
              data: {
                label: n.label || n.entity_id,
                entityType: n.entity_type,
                entityId: n.entity_id,
                properties: n.properties,
                color: nodeColors[n.entity_type] || '#64748b',
                isHighlighted: false,
              },
            };
          });

          // Create new edges
          const newEdges = result.data
            .filter(n => n.relationship_type)
            .map((n, idx) => ({
              id: `edge-${node.id}-${n.id}-${idx}`,
              source: n.direction === 'outgoing' ? node.id : n.id,
              target: n.direction === 'outgoing' ? n.id : node.id,
              label: n.relationship_type?.replace(/_/g, ' '),
              type: 'smoothstep',
              style: {
                stroke: edgeColors[n.relationship_type] || '#94a3b8',
                strokeWidth: 2,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: edgeColors[n.relationship_type] || '#94a3b8',
              },
            }));

          setNodes(prev => [...prev, ...flowNodes]);
          setEdges(prev => [...prev, ...newEdges]);

          // Notify parent
          onNodeExpand(
            newNodes.map(n => ({
              id: n.id,
              entity_type: n.entity_type,
              entity_id: n.entity_id,
              label: n.label,
              properties: n.properties,
            })),
            newEdges.map(e => ({
              id: e.id,
              source_node_id: e.source,
              target_node_id: e.target,
            }))
          );

          toast.success(`Added ${newNodes.length} nodes`, { id: 'expand' });
        } else {
          toast.success('No new nodes to add', { id: 'expand' });
        }
      } else {
        toast.success('No connected nodes found', { id: 'expand' });
      }
    } catch (error) {
      toast.error('Failed to expand node', { id: 'expand' });
      console.error(error);
    } finally {
      setIsExpanding(false);
    }
  }, [nodes, isExpanding, setNodes, setEdges, onNodeExpand]);

  // Mini map node color
  const nodeColor = useCallback((node) => node.data?.color || '#64748b', []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls
          showInteractive={false}
          className="bg-white rounded-xl shadow-lg border border-gray-200"
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="bg-white rounded-xl shadow-lg border border-gray-200"
          pannable
          zoomable
        />

        {/* Legend Panel */}
        <Panel position="bottom-left" className="bg-white rounded-xl shadow-lg border border-gray-200 p-3">
          <div className="flex flex-wrap gap-3">
            {Object.entries(nodeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 capitalize">
                  {type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Instructions Panel */}
        <Panel position="top-left" className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-600">
            <p><strong>Click</strong> a node to see details</p>
            <p><strong>Double-click</strong> to expand relationships</p>
            <p><strong>Drag</strong> to move nodes</p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default GraphExplorer;
