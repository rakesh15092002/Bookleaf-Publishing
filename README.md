# BookLeaf: Author Support Portal with AI-Powered Responses

A full-stack application for publishing companies to manage author relationships, handle support tickets, and generate AI-powered responses using Retrieval-Augmented Generation (RAG).

**Live Status**: ✅ Production-Ready  
**AI Integration**: ✅ Groq LLM + RAG System (87% Token Reduction)  
**Real-time Updates**: ✅ Supabase Realtime  
**Cost Optimization**: ✅ Smart Chunking & Semantic Retrieval

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [AI Integration & RAG System](#ai-integration--rag-system)
- [API Documentation](#api-documentation)
- [Seeded Credentials](#seeded-credentials)
- [Database Schema](#database-schema)
- [Error Handling & Rate Limiting](#error-handling--rate-limiting)
- [Cost Management Strategy](#cost-management-strategy)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (Supabase)
- Groq API Key (free tier available)
- Environment variables configured

### Installation & Running

```bash
# 1. Clone the repository
git clone <repo-url>
cd BookLeaf

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Configure environment variables
# Create .env files in both server/ and client/ directories (see Environment Setup below)

# 4. Seed the database with sample data
cd server
npm run seed

# 5. Start the development servers
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend (from client/)
npm run dev

# 6. Open in browser
# http://localhost:5173 (Frontend)
# Backend API: http://localhost:3000
```

---

## Architecture Overview 

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (React + Vite)                     │
│  Dashboard | Author Profile | Ticket Management | Real-time Updates  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (REST API + WebSocket)
┌──────────────────────────▼──────────────────────────────────────────┐
│                    EXPRESS BACKEND LAYER                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ MIDDLEWARE: Auth | Rate Limiting | Error Handling | Validation│ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ CONTROLLERS: Tickets | Messages | Authors | AI | RAG          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ SERVICES LAYER                                                 │ │
│  │ ├─ AuthService (JWT + Bcrypt)                                 │ │
│  │ ├─ RAGService (Semantic Search + TF-IDF Embeddings)          │ │
│  │ ├─ AIService (Groq LLM Integration)                          │ │
│  │ ├─ TicketService (CRUD + Analytics)                          │ │
│  │ └─ BookService (Royalty Tracking)                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ REPOSITORIES: Database Query Layer (Abstract DB logic)        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (JavaScript SDK)
┌──────────────────────────▼──────────────────────────────────────────┐
│              DATABASE LAYER (Supabase PostgreSQL)                    │
│  ├─ users (Authentication & Profiles)                               │
│  ├─ books (Catalog & Royalty Tracking)                             │
│  ├─ tickets (Support Issues)                                        │
│  ├─ messages (Ticket Conversations)                                │
│  ├─ notes (Internal Admin Notes)                                   │
│  └─ rag_analytics (Performance Metrics)                            │
│                                                                      │
│  🔐 Row-Level Security (RLS) enabled on all tables                 │
│  ⚡ Realtime Subscriptions on messages & tickets                    │
└──────────────────────────────────────────────────────────────────────┘
                           │ (API)
┌──────────────────────────▼──────────────────────────────────────────┐
│                  EXTERNAL SERVICES                                    │
│  ├─ Groq API (LLM for response generation)                          │
│  ├─ Supabase Auth (User authentication)                            │
│  └─ Supabase Realtime (WebSocket updates)                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

#### 1. **Retrieval-Augmented Generation (RAG) - Why?**
- **Problem**: Full knowledge base (2,850+ tokens) per request = High cost & latency
- **Solution**: Smart semantic chunking + TF-IDF embeddings
- **Result**: 87% token reduction (from 3,000 to 400 tokens per request)
- **Implementation**: Zero external vector DB (JS native) → Faster, cheaper, portable

#### 2. **Layered Architecture**
- **Controllers**: Handle HTTP requests, validation
- **Services**: Business logic, orchestration of multiple operations
- **Repositories**: Data access abstraction (easy to swap DB later)
- **Middleware**: Cross-cutting concerns (auth, rate limiting, error handling)
- **Benefit**: Testable, maintainable, loosely coupled

#### 3. **Real-time Updates (Supabase Realtime)**
- Authors get **instant notifications** when tickets are updated
- Admins see messages appearing live without refreshing
- Uses PostgreSQL's WAL (Write-Ahead Log) for change notifications
- **Row-Level Security** enforces data privacy at DB level

#### 4. **Authentication: JWT + Bcrypt**
- Passwords hashed with bcrypt (never stored plain text)
- JWT tokens expire after 24 hours
- Role-based access control (RBAC): `admin` vs `author`
- Middleware validates every protected request

---

## Technology Stack

| Layer        | Technology | Purpose |
|-------------|-----------|---------|
| **Frontend** | React 19 + Vite | Fast development, hot reloading |
| **Styling** | TailwindCSS v4 | Utility-first CSS |
| **UI Icons** | Lucide React | Consistent icon library |
| **Routing** | React Router v7 | Client-side navigation |
| **HTTP** | Axios | REST API calls |
| **Backend** | Express.js v5 | HTTP server framework |
| **Database** | Supabase (PostgreSQL) | Managed DB with Auth + Realtime |
| **AI** | Groq LLM | Fast, cost-effective inference |
| **Auth** | JWT + Bcrypt | Secure authentication |
| **Validation** | Express Validator | Input sanitization |
| **Rate Limiting** | Express Rate Limit | DDoS protection |
| **Monitoring** | Morgan | HTTP request logging |
| **Security** | Helmet | Security headers |
| **CORS** | CORS middleware | Cross-origin requests |
| **Embeddings** | TF-IDF (native JS) | Semantic search without external API |

---

## Setup Instructions

### Step 1: Environment Configuration

Create `.env` file in `server/` directory:

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=24h

# AI & LLM
GROQ_API_KEY=your_groq_api_key_here

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: Pinecone (if using vector DB)
USE_PINECONE=false
# PINECONE_API_KEY=optional
# PINECONE_ENVIRONMENT=optional
# PINECONE_INDEX_NAME=optional

# Logging
LOG_LEVEL=debug
```

Create `.env` file in `client/` directory:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 2: Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your API keys from Project Settings → API
3. Run SQL migrations (from `server/docs/SUPABASE_REALTIME_SETUP.sql`):
   - Execute in Supabase SQL Editor
   - Enables realtime on `messages` and `tickets` tables
   - Sets up Row-Level Security policies

### Step 3: Seed Sample Data

```bash
cd server
npm run seed
```

This creates:
- 10 sample authors with books
- Pre-loaded knowledge base for RAG
- Sample tickets and messages

### Step 4: Get API Keys

**Groq API**:
- Free account at [console.groq.com](https://console.groq.com)
- No credit card required for free tier
- Tokens refresh monthly

**Supabase**:
- Free tier includes: PostgreSQL DB, Auth, Realtime, 500MB storage
- No payment required for development

---

## Project Structure

```
BookLeaf/
├── server/                          # Express Backend
│   ├── src/
│   │   ├── app.js                  # Express app setup
│   │   ├── config/
│   │   │   ├── env.js              # Environment validation
│   │   │   ├── groq.js             # Groq client config
│   │   │   └── supabase.js         # Supabase client setup
│   │   │
│   │   ├── controllers/            # HTTP request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── tickets.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── messages.controller.js
│   │   │   └── ...
│   │   │
│   │   ├── services/               # Business logic & orchestration
│   │   │   ├── auth.service.js
│   │   │   ├── tickets.service.js
│   │   │   ├── books.service.js
│   │   │   ├── ai/
│   │   │   │   ├── draft.service.js        # 🤖 RAG-enhanced draft generation
│   │   │   │   ├── classify.service.js     # 🤖 Ticket classification
│   │   │   │   ├── priority.service.js     # 🤖 Priority scoring
│   │   │   │   └── aiClient.js             # Core LLM interface
│   │   │   └── rag/
│   │   │       ├── rag.service.js          # 🔍 Main RAG orchestrator
│   │   │       ├── embeddings.service.js   # 📊 TF-IDF embeddings
│   │   │       ├── chunking.service.js     # ✂️ Smart KB chunking
│   │   │       └── rag.analytics.js        # 📈 Performance tracking
│   │   │
│   │   ├── repositories/           # Data access layer (DB queries)
│   │   │   ├── user.repository.js
│   │   │   ├── ticket.repository.js
│   │   │   ├── book.repository.js
│   │   │   └── ...
│   │   │
│   │   ├── routes/                 # API endpoints
│   │   │   ├── auth.routes.js      # POST /api/auth/login
│   │   │   ├── tickets.routes.js   # CRUD /api/tickets
│   │   │   ├── ai.routes.js        # POST /api/ai/{classify|draft|priority}
│   │   │   ├── rag.routes.js       # GET /api/rag/{statistics|analytics}
│   │   │   └── ...
│   │   │
│   │   ├── middleware/             # Express middleware
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   ├── role.middleware.js   # Admin/author authorization
│   │   │   ├── error.middleware.js  # Centralized error handler
│   │   │   ├── validate.middleware.js
│   │   │   └── rateLimit.middleware.js
│   │   │
│   │   ├── prompts/                # LLM prompt templates
│   │   │   ├── draft.prompt.js      # Response draft prompt
│   │   │   ├── classify.prompt.js
│   │   │   ├── priority.prompt.js
│   │   │   └── ...
│   │   │
│   │   ├── knowledge-base/         # RAG knowledge chunks
│   │   │   ├── general.js          # General publishing info
│   │   │   ├── royalty.js          # Royalty policy
│   │   │   ├── production.js       # Production timelines
│   │   │   ├── isbn.js             # ISBN allocation
│   │   │   ├── distribution.js     # Distribution channels
│   │   │   └── printing.js         # Printing specifications
│   │   │
│   │   ├── validators/             # Input validation schemas
│   │   │   ├── auth.validator.js
│   │   │   ├── ticket.validator.js
│   │   │   └── ...
│   │   │
│   │   └── utils/
│   │       ├── logger.js           # Logging utility
│   │       ├── apiResponse.js      # Consistent response format
│   │       ├── AppError.js         # Custom error class
│   │       └── pagination.js
│   │
│   ├── scripts/
│   │   ├── seed.js                 # Database seeding
│   │   ├── createAdmin.js          # Admin user creation
│   │   └── migrate.js              # Database migrations
│   │
│   ├── docs/
│   │   ├── RAG_IMPLEMENTATION.md    # RAG system documentation
│   │   ├── SUPABASE_REALTIME_SETUP.sql
│   │   └── api-overview.md
│   │
│   ├── index.js                    # Server entry point
│   ├── .env                        # Environment variables (git ignored)
│   └── package.json
│
├── client/                          # React Frontend
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Root component
│   │   ├── index.css               # Global styles
│   │   │
│   │   ├── components/             # Reusable React components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── PriorityBadge.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── authorComponents/
│   │   │       ├── StatCard.jsx
│   │   │       └── DashboardSkeleton.jsx
│   │   │
│   │   ├── pages/                  # Page components
│   │   │   ├── admin/
│   │   │   │   ├── AuthorRegistry.jsx
│   │   │   │   ├── AuthorDetail.jsx
│   │   │   │   └── TicketManagement.jsx
│   │   │   ├── author/
│   │   │   ├── auth/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── context/                # React Context
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   └── useAuth.js
│   │   │
│   │   ├── services/               # API service layer
│   │   │   └── api.js              # Axios instance + API calls
│   │   │
│   │   ├── lib/                    # Third-party integrations
│   │   │   └── supabase.js         # Supabase client
│   │   │
│   │   └── utils/
│   │       ├── helpers.js
│   │       ├── testRealtime.js     # Development tools
│   │       └── diagnosticScript.js
│   │
│   ├── public/                      # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   ├── .env                        # Environment variables
│   └── package.json
│
├── README.md                        # This file
├── IMPLEMENTATION_SUMMARY.md        # RAG implementation details
└── BEFORE_AND_AFTER.md             # System evolution
```

---

## AI Integration & RAG System

### WorkFlow
<img width="2836" height="3553" alt="Untitled-2026-04-23-0905" src="https://github.com/user-attachments/assets/5e9d126b-4664-42e3-a47b-f7857bca6dca" />



### Overview

The application uses **Retrieval-Augmented Generation (RAG)** to generate contextually accurate support responses while minimizing API costs.

### How It Works

#### 1. **Knowledge Base Chunking**

Raw knowledge is split into semantic chunks (~48 total):

```javascript
// Example chunks from royalty.js knowledge base
{
  id: "royalty_payment_schedule",
  title: "Payment Schedule",
  content: "Royalties are calculated quarterly (Jan, Apr, Jul, Oct)...",
  category: "royalty",
  tokens: 120
}
```

**Chunking Strategy**:
- By logical sections (not arbitrary split)
- Each chunk represents a complete idea
- Average ~100-150 tokens per chunk
- Metadata tagged for filtering

#### 2. **Semantic Similarity Matching**

When a ticket comes in:

```javascript
// Input ticket
{
  subject: "When will I receive my royalty payment?",
  description: "It's been 3 months, still waiting...",
  category: "royalty"
}

// TF-IDF embedding generated
// Compared against all knowledge chunks
// Top 3 most relevant chunks retrieved
```

**Algorithm**: TF-IDF (Term Frequency-Inverse Document Frequency)
- Fast (no external API calls)
- Effective for keyword-based search
- Cosine similarity scoring for ranking

#### 3. **LLM Prompt with Context**

Instead of:
```
Full 2,850 token knowledge base + prompt = 3,000+ tokens input
```

Now:
```
Only 3 relevant chunks (~250 tokens) + prompt = 400 tokens input
Result: 87% reduction in API calls = 87% cost savings 💰
```

#### 4. **Fallback Mechanisms**

If RAG fails or LLM is unavailable:

```
❌ LLM unavailable → Use template response
❌ Rate limit hit → Use pre-written templates
✅ Degraded mode: Still provides value to users
```

### RAG Analytics

Track performance and cost savings:

```bash
# Endpoint: GET /api/rag/analytics
{
  "totalRequests": 124,
  "avgInputTokens": 385,
  "totalTokensSaved": 314000,
  "costSavings": "USD 12.56",
  "byCategory": {
    "royalty": { requests: 45, savings: "87%" },
    "isbn": { requests: 32, savings: "84%" },
    ...
  }
}
```

### Prompt Strategy

Each AI operation has a carefully crafted prompt:

**Draft Generation Prompt**:
```
You are an empathetic support rep at BookLeaf Publishing.
Draft a helpful response to this ticket.

[KNOWLEDGE BASE - RAG OPTIMIZED]
Retrieved 3 most relevant knowledge chunks

[TICKET INFO]
Author: Priya Sharma, Category: royalty
Subject: "When will I receive my royalty payment?"

[BOOK DATA]
Title: "Whispers of the Ganges" | Pending: ₹3,570

[STRICT RULES]
1. FORMAT: Start with "Dear [Name]," end with "BookLeaf Support Team"
2. TONE: Warm and empathetic
3. ACCURACY: Answer ONLY using Knowledge Base. Don't invent.
4. ACCOUNTABILITY: Own mistakes directly
5. STYLE: 100-150 words, simple language
```

**Result**:
- ✅ Consistent, branded responses
- ✅ Fact-based (sourced from KB)
- ✅ Empathetic and personal
- ✅ Under 150 words (actionable)

---

## API Documentation

### Full API Documentation

See detailed API docs at:
- **OpenAPI/Swagger**: [Postman Collection](https://www.postman.com/workspace/My-Workspace~3fe61fd1-0725-4883-85ef-873f7c4c695f/collection/40693857-c16ff13f-9b4a-4c4f-bcd1-606b7b0e8515)
- **Local**: `server/docs/api-overview.md`
- **OpenAPI JSON**: `server/openapi.json`

---


### Authentication

All protected endpoints require JWT token in header:

```bash
Authorization: Bearer <jwt_token>
```

### Endpoints Summary

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| **POST** | `/auth/login` | ❌ | - | User login |
| **GET** | `/auth/me` | ✅ | Any | Get current user |
| **GET** | `/tickets` | ✅ | Any | List tickets |
| **POST** | `/tickets` | ✅ | author | Create ticket |
| **GET** | `/tickets/:id` | ✅ | Any | Get ticket details |
| **PATCH** | `/tickets/:id/status` | ✅ | admin | Update status |
| **GET** | `/tickets/:id/messages` | ✅ | Any | Get messages |
| **POST** | `/tickets/:id/messages` | ✅ | Any | Add message |
| **POST** | `/ai/classify/:ticketId` | ✅ | admin | Classify ticket |
| **POST** | `/ai/priority/:ticketId` | ✅ | admin | Score priority |
| **POST** | `/ai/draft/:ticketId` | ✅ | admin | Generate draft |
| **GET** | `/rag/analytics` | ✅ | admin | RAG performance |
| **GET** | `/rag/statistics` | ✅ | admin | KB statistics |

### Example: Create Ticket

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "ISBN allocation delay",
    "description": "My book is ready but ISBN hasn't been assigned",
    "category": "isbn"
  }'
```

### Example: Generate Draft Response

```bash
curl -X POST http://localhost:3000/api/ai/draft/ticket-123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'

# Response
{
  "success": true,
  "data": {
    "draft": "Dear Priya,\n\nThank you for reaching out...",
    "source": "ai",
    "ragMetadata": {
      "strategy": "category_match",
      "retrievedChunks": 3,
      "inputTokens": 385
    }
  }
}
```
### Base URL
```
http://localhost:5000/api
```

---

## Seeded Credentials

### Default Admin Account

After running `npm run seed`:

| Field | Value |
|-------|-------|
| **Email** | admin@bookleaf.com |
| **Password** | admin@123 |
| **Role** | admin |

### Sample Author Accounts

All sample authors use the same password for testing:

| Name | Email | Password | City |
|------|-------|----------|------|
| Priya Sharma | priya.sharma@email.com | author@123 | Mumbai |
| Rohit Kapoor | rohit.kapoor@email.com | author@123 | Delhi |
| Ananya Reddy | ananya.reddy@email.com | author@123 | Hyderabad |
| Vikram Joshi | vikram.joshi@email.com | author@123 | Pune |
| Meera Nair | meera.nair@email.com | author@123 | Kochi |

### Sample Books

Each author has 2-3 books with:
- ISBN (978-93-5XXXX-XX-X format)
- Royalty tracking data
- Publication status
- Sales figures

Example Book:
```
Title: "Whispers of the Ganges"
Author: Priya Sharma
ISBN: 978-93-5XXXX-01-1
Genre: Literary Fiction
Status: Published & Live
MRP: ₹399
Author Royalty: ₹35 per copy
Copies Sold: 342
Total Royalty Earned: ₹11,970
Royalty Paid: ₹8,400
Pending Royalty: ₹3,570
```

### Create Admin User

To create additional admin accounts:

```bash
cd server
npm run create-admin
# Follow prompts to enter email and password
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role ENUM ('admin', 'author') DEFAULT 'author',
  author_id VARCHAR UNIQUE,
  name VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Authors Table

```sql
CREATE TABLE authors (
  author_id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  city VARCHAR,
  joined_date DATE,
  total_books INT DEFAULT 0,
  total_royalty_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Books Table

```sql
CREATE TABLE books (
  id VARCHAR PRIMARY KEY,
  author_id VARCHAR REFERENCES authors(author_id),
  title VARCHAR NOT NULL,
  isbn VARCHAR UNIQUE,
  genre VARCHAR,
  publication_date DATE,
  status VARCHAR,
  mrp NUMERIC,
  author_royalty_per_copy NUMERIC,
  copies_sold INT DEFAULT 0,
  total_royalty_earned NUMERIC,
  royalty_paid NUMERIC DEFAULT 0,
  royalty_pending NUMERIC,
  last_royalty_payout_date DATE,
  print_partner VARCHAR,
  available_on TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tickets Table

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  author_id VARCHAR REFERENCES authors(author_id),
  subject VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  status VARCHAR DEFAULT 'open',
  priority INT,
  assigned_to VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Realtime enabled for live updates
```

### Messages Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  sender_id UUID REFERENCES users(id),
  message_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Realtime enabled + RLS policies
```

### RAG Analytics Table

```sql
CREATE TABLE rag_analytics (
  id UUID PRIMARY KEY,
  ticket_id UUID,
  query TEXT,
  category VARCHAR,
  chunks_retrieved INT,
  input_tokens INT,
  strategy VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Handling & Rate Limiting

### Error Handling

Centralized error middleware handles all errors consistently:

```javascript
// Example error response
{
  "success": false,
  "message": "Ticket not found",
  "error": {
    "code": "NOT_FOUND",
    "statusCode": 404,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Custom Error Codes**:
- `VALIDATION_ERROR` (400) - Invalid input
- `UNAUTHORIZED` (401) - Missing/invalid JWT
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource doesn't exist
- `RATE_LIMITED` (429) - Too many requests
- `AI_ERROR` (500) - LLM API failure

### Rate Limiting

Prevent abuse and ensure fair usage:

```
- Global limit: 100 requests per 15 minutes per IP
- Per-user: 50 requests per 15 minutes
- AI endpoints: Extra strict (10 requests per 15 minutes per admin)
```

Configuration in `src/middleware/rateLimit.middleware.js`:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,      // Return info in RateLimit-* headers
  legacyHeaders: false
});
```

---

## Cost Management Strategy

### Challenge
LLM API calls are expensive. Full knowledge base = 2,850+ tokens per request.

### Solution: RAG-Based Cost Optimization

| Metric | Before RAG | After RAG | Savings |
|--------|-----------|----------|---------|
| Input Tokens/Request | 3,000 | 400 | **87% reduction** |
| Cost/Request | ~$0.0003 | ~$0.00004 | **87% cheaper** |
| 10,000 Requests/Month | $3.00 | $0.40 | **$2.60/month** |

### Implementation Details

**1. Smart Chunking** (embeddings.service.js)
- No external vector DB needed
- TF-IDF embeddings (free, fast, native JS)
- Semantic chunk boundaries

**2. Caching Layer** (considered for future)
- Cache frequent query results
- Reduce redundant KB queries
- TTL: 24 hours

**3. Model Selection**
- Groq API (fast, cheap)
- `mixtral-8x7b-32768` model
- ~0.00005$ per 1K input tokens

**4. Fallback Templates**
- For rate limit errors → Pre-written templates
- For LLM unavailable → Template responses
- No loss of service

### Cost Dashboard

Access at: `GET /api/rag/analytics`

```bash
{
  "costSavings": {
    "totalTokensSaved": 314000,
    "estimatedUSDSaved": 12.56,
    "reduction": "87%"
  },
  "predictions": {
    "monthlyRequests": 1240,
    "estimatedMonthlyCost": 0.49,
    "estimatedMonthlySavings": 3.71
  }
}
```

---

## Known Limitations

### 1. **TF-IDF vs Vector Embeddings**
- **Current**: TF-IDF (keyword-based semantic search)
- **Limitation**: Not effective for synonym queries
- **Example**: Query "when's my payout?" might not match "royalty payment schedule"
- **Future**: Integrate OpenAI embeddings or Pinecone for better semantic matching

### 2. **No Multi-language Support**
- All content in English only
- No automatic translation
- **Impact**: Limited to English-speaking authors

### 3. **Knowledge Base Size Scaling**
- Current: 48 semantic chunks
- For 1000+ chunks: TF-IDF becomes slower
- **Future**: Migrate to vector DB (Pinecone/Weaviate)

### 4. **Realtime Message Notifications**
- Supabase Realtime has ~500ms latency
- Not suitable for sub-100ms requirements
- **Acceptable for**: Support tickets (human perception doesn't notice 500ms)

### 5. **No AI Response Moderation**
- LLM can generate hallucinations (false facts)
- **Mitigation**: RAG ensures only KB facts are used
- **Still Risk**: LLM might generate facts beyond retrieved chunks

### 6. **Manual Data Entry**
- No API for bulk import of books/authors
- Currently seeded manually via scripts

### 7. **No File Upload Support**
- Can't attach PDF/images to tickets
- Only text-based communication

### 8. **Limited Analytics**
- No dashboard for admin metrics
- Only JSON endpoints
- Need UI for: ticket trends, response times, author satisfaction

---

## Future Improvements

### High Priority (Production-Ready)

#### 1. **Migrate TF-IDF to Vector Embeddings** (2-3 weeks)
- Integrate Pinecone or Weaviate
- Switch from keyword→semantic search
- Better handling of synonyms and context
- **Benefit**: Improved accuracy for niche queries

#### 2. **AI Response Moderation** (1 week)
- Fact-check LLM outputs against KB
- Prevent hallucinations
- Flag uncertain responses for manual review
- **Tool**: Use Claude's moderation or custom confidence scorer

#### 3. **Admin Analytics Dashboard** (2 weeks)
- Real-time ticket metrics
- Response time analytics
- Author satisfaction tracking
- Cost/savings visualization

#### 4. **Multi-language Support** (3-4 weeks)
- Translate knowledge base to Hindi, Tamil, Telugu
- Auto-detect author language
- Generate responses in author's language
- **Tool**: Google Translate API or OpenAI Translation

### Medium Priority (Scale-Ready)

#### 5. **File Upload & Attachments** (2 weeks)
- Store PDFs/images on Supabase Storage
- Extract text from PDFs for context
- Link attachments to tickets

#### 6. **Bulk Import API** (1 week)
- CSV upload for authors/books
- Batch operations
- Data validation

#### 7. **Email Notifications** (1 week)
- Send emails when tickets are assigned
- Daily digest of activities
- Integration with SendGrid/AWS SES

#### 8. **Advanced Search** (1 week)
- Full-text search across tickets
- Filter by date, category, status
- Saved search filters

### Lower Priority (Nice-to-Have)

#### 9. **Custom KB Management UI**
- Web interface to edit knowledge base
- No more editing JSON files manually
- Version control for KB changes

#### 10. **Audit Logging**
- Track all admin actions
- Compliance reporting
- Who changed what, when

#### 11. **Mobile App**
- React Native app for authors
- Push notifications for ticket updates
- Mobile-optimized dashboard

#### 12. **Chatbot Integration**
- Slack/WhatsApp chatbot for authors
- Self-serve ticket creation
- 24/7 availability

---

## Development Tips

### Running in Development Mode

**Backend with hot reload**:
```bash
cd server
npm run dev
# Uses nodemon to auto-restart on changes
```

**Frontend with hot reload**:
```bash
cd client
npm run dev
# Vite provides instant HMR
```

**Testing RAG manually**:
```bash
cd server
node src/utils/testRealtime.js
# or access diagnostic endpoint:
# POST /api/rag/test-retrieval
```

### Debugging

**Backend Logging**:
```javascript
// All logs go to console with timestamps
logger.info('message', {optional: 'context'});
logger.error('error', errorObject);
logger.ai('AI operation', {details: 'here'});
```

**View Logs**:
- Check terminal where `npm run dev` is running
- Format: `[timestamp] [level] [module] message`

### Testing AI Locally

```javascript
// In server root
import aiClient from './src/services/ai/aiClient.js';

const response = await aiClient.callAI('Hello, who are you?');
console.log(response);
```

---

## Support & Troubleshooting

### Common Issues

**Q: "Cannot find module '@supabase/supabase-js'"**
```bash
Solution: cd server && npm install
```

**Q: "GROQ_API_KEY not found"**
```bash
Solution: Check .env file, restart server after adding key
```

**Q: "Database connection failed"**
```bash
Solution: Verify SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
```

**Q: "JWT token expired"**
```bash
Solution: Re-login to get new token (valid for 24 hours)
```

**Q: "Real-time updates not working"**
```bash
Solution: Run SUPABASE_REALTIME_SETUP.sql in Supabase editor
```

---

## License

ISC

---

## Acknowledgments

- **Groq**: Fast, affordable LLM inference
- **Supabase**: PostgreSQL + Auth + Realtime magic
- **React + Vite**: Modern frontend tooling
- **Express**: Lightweight, industry-standard backend

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production-Ready
