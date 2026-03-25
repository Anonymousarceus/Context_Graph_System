/**
 * Stats Panel Component
 * Shows graph statistics in an overlay panel
 */

import React from 'react';

function StatsPanel({ stats, onClose }) {
  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 w-80 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Graph Statistics</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Total Counts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-primary-700">{stats.totalNodes?.toLocaleString()}</p>
          <p className="text-xs text-primary-600 font-medium">Total Nodes</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-700">{stats.totalEdges?.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-medium">Total Edges</p>
        </div>
      </div>

      {/* Nodes by Type */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Nodes by Type
        </h3>
        <div className="space-y-2">
          {stats.nodesByType?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 capitalize">
                {item.entity_type?.replace('_', ' ')}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {parseInt(item.count).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edges by Type */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Relationships
        </h3>
        <div className="space-y-2">
          {stats.edgesByType?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-mono">
                {item.relationship_type}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {parseInt(item.count).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
