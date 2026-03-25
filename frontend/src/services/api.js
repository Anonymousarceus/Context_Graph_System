/**
 * API Service
 * Handles all HTTP requests to the backend
 */

// Use environment variable or fallback to relative path (for Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============ Graph API ============

/**
 * Get graph statistics
 */
export const getGraphStats = () => fetchApi('/graph/stats');

/**
 * Get initial graph data for visualization
 */
export const getInitialGraph = (limit = 50) =>
  fetchApi(`/graph/initial?limit=${limit}`);

/**
 * Get all nodes with optional filtering
 */
export const getNodes = (type = null, limit = 100) => {
  let endpoint = `/graph/nodes?limit=${limit}`;
  if (type) endpoint += `&type=${type}`;
  return fetchApi(endpoint);
};

/**
 * Get node by ID with relationships
 */
export const getNodeById = (id) => fetchApi(`/graph/nodes/${id}`);

/**
 * Expand node to get neighbors
 */
export const expandNode = (id, direction = 'both', limit = 50) =>
  fetchApi(`/graph/nodes/${id}/expand?direction=${direction}&limit=${limit}`);

/**
 * Trace document flow
 */
export const traceFlow = (documentType, documentId) =>
  fetchApi(`/graph/trace/${documentType}/${documentId}`);

/**
 * Find broken flows
 */
export const findBrokenFlows = (flowType) =>
  fetchApi(`/graph/broken-flows/${flowType}`);

/**
 * Search nodes
 */
export const searchNodes = (query, type = null, limit = 50) => {
  let endpoint = `/graph/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (type) endpoint += `&type=${type}`;
  return fetchApi(endpoint);
};

/**
 * Get top products by billing
 */
export const getTopProducts = (limit = 10) =>
  fetchApi(`/graph/analytics/top-products?limit=${limit}`);

/**
 * Get customer statistics
 */
export const getCustomerStats = (customerId) =>
  fetchApi(`/graph/analytics/customer/${customerId}`);

// ============ Chat API ============

/**
 * Process natural language query
 */
export const processQuery = (query, sessionId) =>
  fetchApi('/chat/query', {
    method: 'POST',
    body: JSON.stringify({ query, sessionId }),
  });

/**
 * Get conversation history
 */
export const getConversationHistory = (sessionId, limit = 20) =>
  fetchApi(`/chat/history/${sessionId}?limit=${limit}`);

/**
 * Clear conversation history
 */
export const clearConversationHistory = (sessionId) =>
  fetchApi(`/chat/history/${sessionId}`, { method: 'DELETE' });

/**
 * Get suggested queries
 */
export const getSuggestions = () => fetchApi('/chat/suggestions');

export default {
  // Graph
  getGraphStats,
  getInitialGraph,
  getNodes,
  getNodeById,
  expandNode,
  traceFlow,
  findBrokenFlows,
  searchNodes,
  getTopProducts,
  getCustomerStats,
  // Chat
  processQuery,
  getConversationHistory,
  clearConversationHistory,
  getSuggestions,
};
