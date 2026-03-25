# Context Graph Query System

A production-ready, full-stack application that converts fragmented SAP Order-to-Cash (O2C) business data into an interconnected graph, enabling visual exploration and natural language querying powered by LLM.

![Architecture](https://via.placeholder.com/800x400?text=Context+Graph+Query+System)

## Features

### Graph Visualization
- Interactive graph explorer with React Flow
- Expand nodes on click to discover relationships
- Node metadata panel with detailed entity information
- Zoom, pan, and minimap navigation
- Smooth animations and hover effects
- Color-coded entity types

### Conversational Query Interface
- Natural language questions about your data
- LLM-powered intent parsing using Google Gemini
- Dynamic SQL/Graph query generation
- Data-grounded responses (no hallucination)
- Query explanation panel
- Conversation memory within sessions

### O2C Process Flow
- Trace complete document flows: Sales Order → Delivery → Billing → Payment
- Identify broken flows (delivered but not billed, etc.)
- Customer and product analytics
- Entity relationship exploration

### Guardrails
- Domain classifier rejects off-topic queries
- Only answers questions related to the dataset
- Clear feedback for out-of-scope requests

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS |
| Graph Visualization | React Flow (@xyflow/react) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (with graph modeling) |
| LLM | Google Gemini API |
| State Management | React Hooks |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  Graph Explorer  │  │       Chat Panel                 │ │
│  │  (React Flow)    │  │   (Conversational Interface)     │ │
│  └────────┬─────────┘  └─────────────┬────────────────────┘ │
│           │                          │                       │
│           └──────────┬───────────────┘                       │
└──────────────────────┼───────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────┼───────────────────────────────────────┐
│                      ▼           BACKEND                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Express Server                        ││
│  │  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  ││
│  │  │ Graph API  │  │  Chat API  │  │  Analytics API    │  ││
│  │  └─────┬──────┘  └─────┬──────┘  └────────┬──────────┘  ││
│  │        │               │                   │             ││
│  │  ┌─────▼───────────────▼───────────────────▼───────────┐││
│  │  │                 Service Layer                        │││
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │││
│  │  │  │ Graph Service│ │ LLM Service  │ │Query Service │ │││
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘ │││
│  │  └──────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│   MongoDB        │    │   Gemini API     │
│   (Graph Data)   │    │   (NLP/LLM)      │
└──────────────────┘    └──────────────────┘
```

---

## Graph Schema

### Nodes
| Entity Type | Description |
|------------|-------------|
| `customer` | Business partners / customers |
| `sales_order` | Sales order headers |
| `delivery` | Outbound delivery headers |
| `billing_document` | Billing document headers (invoices) |
| `payment` | Payment records |
| `product` | Material/product master data |
| `address` | Customer addresses |

### Relationships (Edges)
| Relationship | From → To |
|-------------|-----------|
| `CUSTOMER_PLACED_ORDER` | Customer → Sales Order |
| `ORDER_CONTAINS_ITEM` | Sales Order → Product |
| `ORDER_HAS_DELIVERY` | Sales Order → Delivery |
| `DELIVERY_GENERATED_BILLING` | Delivery → Billing Document |
| `BILLING_HAS_PAYMENT` | Billing Document → Payment |
| `CUSTOMER_HAS_ADDRESS` | Customer → Address |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Setup

```bash
# Navigate to project directory
cd context-graph-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

MongoDB Atlas is used (cloud-hosted). The connection string is already configured in `.env`.

If you want to use your own MongoDB:
- Create a MongoDB Atlas cluster at https://www.mongodb.com/atlas
- Get your connection string
- Update `MONGODB_URI` in `backend/.env`

### 3. Configure Environment

```bash
# Copy example env file
cd backend
cp .env.example .env

# Edit .env with your settings
# - Database credentials
# - Gemini API key (already provided)
```

### 4. Initialize Database Schema

```bash
cd backend
npm run seed
```

### 5. Ingest Data

```bash
# Make sure you're in the backend directory
npm run ingest
```

This will load all SAP O2C data from `../sap-o2c-data/` into MongoDB.

### 6. Start the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 7. Access the Application

Open http://localhost:5173 in your browser.

---

## API Endpoints

### Graph API (`/api/graph`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get graph statistics |
| GET | `/initial` | Get initial graph data |
| GET | `/nodes` | Get all nodes (with optional type filter) |
| GET | `/nodes/:id` | Get node by ID with relationships |
| GET | `/nodes/:id/expand` | Expand node to get neighbors |
| GET | `/trace/:documentType/:documentId` | Trace document flow |
| GET | `/broken-flows/:flowType` | Find broken flows |
| GET | `/search` | Search nodes |
| GET | `/analytics/top-products` | Get top products by billing |
| GET | `/analytics/customer/:id` | Get customer statistics |

### Chat API (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/query` | Process natural language query |
| GET | `/history/:sessionId` | Get conversation history |
| DELETE | `/history/:sessionId` | Clear conversation history |
| GET | `/suggestions` | Get suggested queries |

---

## Sample Queries

### Flow Analysis
- "Trace the full flow of billing document 90504248"
- "Show the O2C process for sales order 740506"
- "What happened to delivery 80737721?"

### Anomaly Detection
- "Find all deliveries that were not billed"
- "Show billing documents without associated deliveries"
- "Which billing documents are unpaid?"

### Analytics
- "Which products have the highest billing amounts?"
- "Show top 10 customers by order value"
- "How many orders were placed in April 2025?"

### Entity Lookup
- "Find customer 320000083"
- "Search for product B8907367041603"
- "Show all billing documents for customer 320000082"

---

## Project Structure

```
context-graph-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL connection & schema
│   │   ├── controllers/
│   │   │   ├── graphController.js
│   │   │   └── chatController.js
│   │   ├── services/
│   │   │   ├── graphService.js   # Graph operations
│   │   │   ├── llmService.js     # Gemini integration
│   │   │   └── queryService.js   # Query orchestration
│   │   ├── routes/
│   │   │   ├── graphRoutes.js
│   │   │   └── chatRoutes.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   └── logger.js
│   │   └── index.js              # Express app entry
│   ├── scripts/
│   │   ├── ingestData.js         # Data ingestion pipeline
│   │   └── seedDatabase.js       # Schema initialization
│   ├── package.json
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Graph/
│   │   │   │   ├── GraphExplorer.jsx
│   │   │   │   └── CustomNode.jsx
│   │   │   ├── Chat/
│   │   │   │   └── ChatPanel.jsx
│   │   │   └── Layout/
│   │   │       ├── Header.jsx
│   │   │       ├── EntitySidebar.jsx
│   │   │       └── StatsPanel.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## Key Design Decisions

### Graph Modeling in MongoDB
We model the graph structure using two collections:
- `nodes`: Stores all entities with type, properties (embedded documents)
- `edges`: Stores relationships between nodes (references)

This allows for:
- Flexible schema with embedded documents
- Aggregation pipeline for graph traversals
- Easy integration with existing data
- Cloud-hosted with MongoDB Atlas

### LLM Query Pipeline
1. **Domain Check**: Validate query is O2C-related
2. **Intent Parsing**: LLM extracts intent and entities
3. **Query Generation**: Generate SQL or graph operation
4. **Execution**: Run against database
5. **Response Generation**: LLM formats results naturally

### Guardrails
- Keyword-based domain classifier
- Off-topic pattern detection
- LLM temperature kept low (0.1-0.3)
- Responses grounded in actual data

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 3001 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | (required) |
| `GEMINI_API_KEY` | Google Gemini API key | (required) |
| `DATA_SOURCE_PATH` | Path to SAP data | ../../sap-o2c-data |

---

## Troubleshooting

### Database Connection Error
- Check your MongoDB Atlas cluster is running
- Verify your IP address is whitelisted in Atlas Network Access
- Ensure connection string is correct in `.env`

### Data Not Loading
```bash
# Check data path
ls ../sap-o2c-data/

# Re-run seed and ingest
npm run seed
npm run ingest
```

### Frontend Not Connecting
- Ensure backend is running on port 3001
- Check CORS settings in backend
- Verify Vite proxy configuration

---

## License

MIT License - Feel free to use and modify.

---

## Credits

Built with:
- [React Flow](https://reactflow.dev/) - Graph visualization
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Google Gemini](https://ai.google.dev/) - LLM
- [Express](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://www.postgresql.org/) - Database
