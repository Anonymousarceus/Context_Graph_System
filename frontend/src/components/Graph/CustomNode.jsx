/**
 * Custom Node Component
 * Styled node for React Flow graph
 */

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

// Node type icons
const icons = {
  customer: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  sales_order: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  delivery: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  billing_document: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  payment: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  product: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  address: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function CustomNode({ data, selected }) {
  const icon = icons[data.entityType] || icons.product;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white"
      />

      <div
        className={`
          bg-white rounded-xl shadow-lg border-2 px-4 py-3 min-w-[160px] max-w-[220px]
          transition-all duration-200 cursor-pointer
          ${selected ? 'ring-2 ring-offset-2' : ''}
          ${data.isHighlighted ? 'animate-pulse ring-2 ring-amber-400 bg-amber-50' : ''}
        `}
        style={{
          borderColor: data.color,
          ...(selected && { ringColor: data.color }),
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: data.color }}
          >
            {icon}
          </div>
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate">
            {data.entityType?.replace('_', ' ')}
          </span>
        </div>

        {/* Label */}
        <p className="text-sm font-semibold text-gray-900 truncate" title={data.label}>
          {data.label}
        </p>

        {/* ID */}
        <p className="text-[10px] text-gray-400 font-mono truncate">
          {data.entityId}
        </p>

        {/* Quick Stats */}
        {data.properties?.totalNetAmount && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-medium" style={{ color: data.color }}>
              {data.properties.currency || 'INR'} {parseFloat(data.properties.totalNetAmount).toLocaleString()}
            </span>
          </div>
        )}
        {data.properties?.amount && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-medium" style={{ color: data.color }}>
              {data.properties.currency || 'INR'} {parseFloat(data.properties.amount).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white"
      />
    </>
  );
}

export default memo(CustomNode);
