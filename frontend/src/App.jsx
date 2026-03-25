import { useState, useEffect, useCallback } from 'react';
import GraphExplorer from './components/Graph/GraphExplorer';
import ChatPanel from './components/Chat/ChatPanel';
import Header from './components/Layout/Header';
import EntitySidebar from './components/Layout/EntitySidebar';
import StatsPanel from './components/Layout/StatsPanel';
import { getGraphStats, getInitialGraph } from './services/api';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [sessionId] = useState(() => uuidv4());
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [graphResult, statsResult] = await Promise.all([
          getInitialGraph(60),
          getGraphStats()
        ]);

        if (graphResult.success) {
          setGraphData(graphResult.data);
        }
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      } catch (error) {
        toast.error('Failed to load initial data. Make sure the backend is running.');
        console.error('Load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Handle node selection
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  // Handle node expansion
  const handleNodeExpand = useCallback((newNodes, newEdges) => {
    setGraphData(prev => {
      const existingNodeIds = new Set(prev.nodes.map(n => n.id));
      const existingEdgeIds = new Set(prev.edges.map(e => e.id));

      const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id));
      const uniqueNewEdges = newEdges.filter(e => !existingEdgeIds.has(e.id));

      return {
        nodes: [...prev.nodes, ...uniqueNewNodes],
        edges: [...prev.edges, ...uniqueNewEdges]
      };
    });
  }, []);

  // Handle query results - highlight relevant nodes
  const handleQueryResult = useCallback((result) => {
    if (result.relevantNodes && result.relevantNodes.length > 0) {
      setHighlightedNodes(result.relevantNodes);

      // Clear highlight after 10 seconds
      setTimeout(() => {
        setHighlightedNodes([]);
      }, 10000);
    }

    // If there's graph data in the result, add it
    if (result.data?.nodes) {
      handleNodeExpand(result.data.nodes, result.data.edges || []);
    }
  }, [handleNodeExpand]);

  // Clear highlights
  const clearHighlights = useCallback(() => {
    setHighlightedNodes([]);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header
        onToggleStats={() => setShowStats(!showStats)}
        showStats={showStats}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Explorer */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading graph data...</p>
              </div>
            </div>
          ) : (
            <GraphExplorer
              initialData={graphData}
              onNodeSelect={handleNodeSelect}
              onNodeExpand={handleNodeExpand}
              highlightedNodes={highlightedNodes}
            />
          )}

          {/* Stats Panel Overlay */}
          {showStats && stats && (
            <div className="absolute top-4 left-4 z-20">
              <StatsPanel stats={stats} onClose={() => setShowStats(false)} />
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-[420px] flex flex-col border-l border-gray-200 bg-white">
          {/* Entity Sidebar (when node selected) */}
          {selectedNode && (
            <div className="border-b border-gray-200">
              <EntitySidebar
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          )}

          {/* Chat Panel */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              sessionId={sessionId}
              onQueryResult={handleQueryResult}
              onClearHighlights={clearHighlights}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
