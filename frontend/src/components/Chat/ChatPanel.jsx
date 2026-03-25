/**
 * Chat Panel Component
 * Conversational query interface for natural language questions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { processQuery, getSuggestions } from '../../services/api';
import toast from 'react-hot-toast';

function ChatPanel({ sessionId, onQueryResult, onClearHighlights }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load suggestions on mount
  useEffect(() => {
    getSuggestions()
      .then(result => {
        if (result.success) {
          setSuggestions(result.data);
        }
      })
      .catch(console.error);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setShowSuggestions(false);
    onClearHighlights();

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await processQuery(userMessage, sessionId);

      // Add assistant response
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.response,
          intent: result.intent,
          explanation: result.explanation,
          queryExplanation: result.queryExplanation,
          sql: result.sql,
          duration: result.duration,
          isOffTopic: result.isOffTopic,
          data: result.data,
        }
      ]);

      // Notify parent of results for highlighting
      if (result.success) {
        onQueryResult(result);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          isError: true,
        }
      ]);
      toast.error('Failed to process query');
      console.error(error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, sessionId, onQueryResult, onClearHighlights]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((query) => {
    setInput(query);
    inputRef.current?.focus();
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setShowSuggestions(true);
    onClearHighlights();
  }, [onClearHighlights]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Query Assistant</h2>
          <p className="text-xs text-gray-500">Ask questions about your O2C data</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome & Suggestions */}
        {showSuggestions && messages.length === 0 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Welcome to Context Graph</h3>
              <p className="text-sm text-gray-500 mt-1">
                Ask questions about orders, deliveries, billing, and payments
              </p>
            </div>

            {/* Suggestion Categories */}
            {suggestions.map((category, catIdx) => (
              <div key={catIdx} className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.queries.map((query, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSuggestionClick(query)}
                      className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-800 rounded-bl-sm'
                    : msg.isOffTopic
                      ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-bl-sm'
                      : 'bg-white border border-gray-200 shadow-sm rounded-bl-sm'
              }`}
            >
              {/* Message Content */}
              <div className={`text-sm whitespace-pre-wrap ${msg.role === 'user' ? '' : 'text-gray-800'}`}>
                {msg.content}
              </div>

              {/* Assistant Metadata */}
              {msg.role === 'assistant' && !msg.isError && !msg.isOffTopic && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {/* Intent Badge */}
                  {msg.intent && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Intent:</span>
                      <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                        {msg.intent.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Query Explanation */}
                  {msg.queryExplanation && (
                    <p className="text-xs text-gray-500 italic">{msg.queryExplanation}</p>
                  )}

                  {/* Duration */}
                  {msg.duration && (
                    <p className="text-[10px] text-gray-400">
                      Processed in {msg.duration}ms
                    </p>
                  )}

                  {/* SQL Query (expandable) */}
                  {msg.sql && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View generated query
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-[10px]">
                        {msg.sql}
                      </pre>
                    </details>
                  )}

                  {/* Data Preview */}
                  {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View raw data ({msg.data.length} items)
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded-lg overflow-x-auto text-[10px] max-h-40">
                        {JSON.stringify(msg.data.slice(0, 5), null, 2)}
                        {msg.data.length > 5 && `\n... and ${msg.data.length - 5} more items`}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="loading-dots flex gap-1">
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about orders, deliveries, billing..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleSuggestionClick('Which products have highest billing?')}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            Top Products
          </button>
          <button
            onClick={() => handleSuggestionClick('Find deliveries not billed')}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            Broken Flows
          </button>
          <button
            onClick={() => handleSuggestionClick('Trace flow of billing document 90504248')}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            Trace Flow
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
