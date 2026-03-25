/**
 * LLM Service
 * Handles interactions with Gemini API for natural language understanding
 */

import { logger } from '../utils/logger.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Schema description for query generation
 */
const SCHEMA_CONTEXT = `
You are a query assistant for a SAP Order-to-Cash (O2C) graph database system.

DATABASE SCHEMA:
- business_partners: id, customer_id, name, full_name, is_blocked
- addresses: business_partner_id, city, country, region, postal_code, street
- products: id, product_type, description, gross_weight, net_weight, product_group
- sales_orders: id, order_type, sold_to_party, creation_date, total_net_amount, currency, delivery_status
- sales_order_items: sales_order_id, item_number, material_id, quantity, net_amount
- deliveries: id, creation_date, goods_movement_status, picking_status
- delivery_items: delivery_id, sales_order_id, quantity, plant
- billing_documents: id, document_type, creation_date, is_cancelled, total_net_amount, sold_to_party, accounting_document
- billing_document_items: billing_document_id, material_id, quantity, net_amount, delivery_id
- payments: accounting_document, clearing_date, amount, customer_id

GRAPH STRUCTURE (nodes table):
- entity_type: sales_order, delivery, billing_document, payment, customer, product, address
- Each node has: id, entity_type, entity_id, label, properties (JSONB)

RELATIONSHIP TYPES (edges table):
- CUSTOMER_PLACED_ORDER: customer -> sales_order
- ORDER_CONTAINS_ITEM: sales_order -> product
- ORDER_HAS_DELIVERY: sales_order -> delivery
- DELIVERY_GENERATED_BILLING: delivery -> billing_document
- BILLING_HAS_PAYMENT: billing_document -> payment
- CUSTOMER_HAS_ADDRESS: customer -> address

The O2C flow is: Sales Order -> Delivery -> Billing Document -> Payment
`;

/**
 * Domain keywords for guardrails
 */
const DOMAIN_KEYWORDS = [
  'order', 'sales', 'delivery', 'billing', 'invoice', 'payment', 'customer',
  'product', 'material', 'amount', 'quantity', 'shipped', 'delivered', 'billed',
  'paid', 'cancelled', 'blocked', 'flow', 'trace', 'document', 'address',
  'o2c', 'sap', 'net amount', 'total', 'count', 'top', 'highest', 'lowest',
  'broken', 'missing', 'without', 'not', 'unpaid', 'pending'
];

/**
 * Check if query is within domain
 */
export const isDomainRelevant = (userQuery) => {
  const lowerQuery = userQuery.toLowerCase();

  // Check for domain keywords
  const hasKeyword = DOMAIN_KEYWORDS.some(keyword => lowerQuery.includes(keyword));

  // Check for off-topic patterns
  const offTopicPatterns = [
    /weather/i, /joke/i, /creative.*writ/i, /poem/i, /story/i,
    /who (is|was)/i, /what is the capital/i, /translate/i,
    /recipe/i, /how to cook/i, /news/i, /movie/i, /music/i,
    /sports/i, /game/i, /play/i, /celebrity/i, /history of/i,
    /generate.*code/i, /write.*program/i, /calculate math/i
  ];

  const isOffTopic = offTopicPatterns.some(pattern => pattern.test(userQuery));

  return hasKeyword && !isOffTopic;
};

/**
 * Parse user intent and generate appropriate action
 */
export const parseIntent = async (userQuery) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `
${SCHEMA_CONTEXT}

USER QUERY: "${userQuery}"

Analyze this query and determine the intent. Return a JSON object with:
{
  "intent": "<one of: trace_flow, find_broken_flows, top_products, customer_stats, search_entity, aggregate_query, general_query>",
  "entities": {
    "document_type": "<sales_order|delivery|billing_document|payment|null>",
    "document_id": "<extracted ID or null>",
    "customer_id": "<extracted customer ID or null>",
    "product_id": "<extracted product ID or null>",
    "flow_type": "<delivered_not_billed|billed_without_delivery|billed_not_paid|null>",
    "search_term": "<search term or null>",
    "limit": <number or 10>
  },
  "sql_query": "<PostgreSQL query to answer the question or null if using graph operations>",
  "explanation": "<brief explanation of what the query is asking>"
}

IMPORTANT RULES:
1. For "trace flow" queries, use intent=trace_flow
2. For "broken flow" or "delivered but not billed" queries, use intent=find_broken_flows
3. For "top products" or "highest billing" queries, use intent=top_products
4. For customer-specific queries, use intent=customer_stats
5. If SQL is needed, write a valid PostgreSQL query
6. Always include the explanation field

Return ONLY valid JSON, no markdown or extra text.
`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Gemini API error', { status: response.status, error: errorText });
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No response from Gemini');
    }

    // Clean up the response (remove markdown code blocks if present)
    let cleanedContent = textContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }

    const parsed = JSON.parse(cleanedContent.trim());
    logger.info('Parsed intent', { intent: parsed.intent, explanation: parsed.explanation });

    return parsed;
  } catch (error) {
    logger.error('Failed to parse intent', { error: error.message });
    throw error;
  }
};

/**
 * Generate natural language response from query results
 */
export const generateResponse = async (userQuery, queryResults, intent) => {
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `
You are a helpful assistant for an Order-to-Cash analytics system.

USER QUESTION: "${userQuery}"

QUERY INTENT: ${intent.intent}
EXPLANATION: ${intent.explanation}

QUERY RESULTS (JSON):
${JSON.stringify(queryResults, null, 2)}

Generate a clear, concise natural language response that:
1. Directly answers the user's question
2. Includes specific numbers and data from the results
3. Highlights any important insights
4. Uses bullet points for lists
5. Is professional but friendly

IMPORTANT:
- Only use information from the provided results
- Do not make up or hallucinate any data
- If results are empty, clearly state that no data was found
- Keep the response under 300 words

Response:
`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return textContent || 'I was unable to generate a response. Please try rephrasing your question.';
  } catch (error) {
    logger.error('Failed to generate response', { error: error.message });
    return `Based on the data: ${JSON.stringify(queryResults).slice(0, 500)}...`;
  }
};

/**
 * Generate query explanation
 */
export const explainQuery = async (sqlQuery, intent) => {
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `
Explain this database query in simple terms:

SQL Query: ${sqlQuery || 'Graph traversal operation'}
Intent: ${intent.intent}

Provide a brief, non-technical explanation of what this query does.
Keep it under 50 words.
`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        }
      })
    });

    if (!response.ok) {
      return 'Query executed successfully.';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Query executed successfully.';
  } catch (error) {
    return 'Query executed successfully.';
  }
};

export default {
  isDomainRelevant,
  parseIntent,
  generateResponse,
  explainQuery
};
