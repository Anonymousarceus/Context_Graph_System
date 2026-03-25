/**
 * Entity Sidebar Component
 * Shows detailed information about a selected node
 */

import React, { useState, useEffect } from 'react';
import { getNodeById } from '../../services/api';

// Entity type icons and colors
const entityConfig = {
  customer: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
  },
  sales_order: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
  },
  delivery: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    ),
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
  },
  billing_document: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
  },
  payment: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
  },
  product: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'rose',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-300',
  },
  address: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'cyan',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-300',
  },
};

function EntitySidebar({ node, onClose }) {
  const [fullNode, setFullNode] = useState(null);
  const [loading, setLoading] = useState(false);

  const config = entityConfig[node?.entity_type] || entityConfig.product;

  useEffect(() => {
    if (node?.id) {
      setLoading(true);
      getNodeById(node.id)
        .then(result => {
          if (result.success) {
            setFullNode(result.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [node?.id]);

  if (!node) return null;

  const properties = fullNode?.properties || node.properties || {};

  return (
    <div className="p-4 max-h-[300px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} ${config.textColor} flex items-center justify-center`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{node.label || node.entity_id}</h3>
            <p className="text-xs text-gray-500 capitalize">
              {node.entity_type?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Properties */}
      {!loading && (
        <div className="space-y-2">
          <div className={`px-3 py-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
            <span className="text-xs font-medium text-gray-600">ID</span>
            <p className={`text-sm font-mono ${config.textColor}`}>{node.entity_id}</p>
          </div>

          {Object.entries(properties).map(([key, value]) => {
            if (value === null || value === undefined || value === '') return null;

            return (
              <div key={key} className="px-3 py-2 rounded-lg bg-gray-50">
                <span className="text-xs font-medium text-gray-500 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                </span>
                <p className="text-sm text-gray-800 break-words">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Relationships */}
      {fullNode?.outgoingRelationships?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Outgoing Relationships ({fullNode.outgoingRelationships.length})
          </h4>
          <div className="space-y-1">
            {fullNode.outgoingRelationships.slice(0, 5).map((rel, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="text-primary-600 font-medium">{rel.relationship_type}</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-700">{rel.target_label}</span>
              </div>
            ))}
            {fullNode.outgoingRelationships.length > 5 && (
              <p className="text-xs text-gray-400">
                +{fullNode.outgoingRelationships.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {fullNode?.incomingRelationships?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Incoming Relationships ({fullNode.incomingRelationships.length})
          </h4>
          <div className="space-y-1">
            {fullNode.incomingRelationships.slice(0, 5).map((rel, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="text-gray-700">{rel.source_label}</span>
                <span className="text-gray-400">→</span>
                <span className="text-primary-600 font-medium">{rel.relationship_type}</span>
              </div>
            ))}
            {fullNode.incomingRelationships.length > 5 && (
              <p className="text-xs text-gray-400">
                +{fullNode.incomingRelationships.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EntitySidebar;
