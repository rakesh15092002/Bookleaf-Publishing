# BookLeaf Architecture & Design Documentation

## Table of Contents
1. [System Architecture Diagram](#system-architecture)
2. [Component Interaction Diagram](#component-interactions)
3. [Data Flow Diagram](#data-flows)
4. [Database Schema](#database-schema)
5. [API Architecture](#api-architecture)
6. [AI/RAG Pipeline](#ai-rag-pipeline)
7. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        React["React SPA<br/>Vite + TailwindCSS"]
        RealTime["Supabase Realtime<br/>WebSocket"]
    end
    
    subgraph "API Layer"
        Express["Express.js Server<br/>Port 3000"]
        Router["Router Layer<br/>Routes Definition"]
    end
    
    subgraph "Application Layer"
        Controllers["Controllers<br/>Request Handlers"]
        Middleware["Middleware<br/>Auth | Validation | Error"]
        Services["Services Layer<br/>Business Logic"]
    end
    
    subgraph "Data Layer"
        Repositories["Repositories<br/>Data Access"]
        Supabase["Supabase PostgreSQL<br/>Database"]
    end
    
    subgraph "AI/Intelligence Layer"
        RAGService["RAG Service<br/>Semantic Retrieval"]
        AIService["AI Service<br/>LLM Integration"]
        GroqAPI["Groq LLM API<br/>mixtral-8x7b"]
    end
    
    subgraph "External Services"
        Auth["Supabase Auth<br/>JWT Tokens"]
        Storage["Supabase Storage<br/>Files"]
    end
    
    React -->|REST API| Express
    React -->|WebSocket| RealTime
    Express --> Router
    Router --> Controllers
    Controllers --> Middleware
    Middleware --> Services
    Services --> Repositories
    Repositories --> Supabase
    Services --> RAGService
    Services --> AIService
    RAGService --> Supabase
    AIService --> GroqAPI
    Supabase --> Auth
    Supabase --> Storage
```

---

## Component Interactions

### Request Flow: Creating and Processing a Ticket

```mermaid
sequenceDiagram
    participant Author as Author (Frontend)
    participant Frontend as React App
    participant Backend as Express Server
    participant Auth as Auth Service
    participant TicketSvc as Ticket Service
    participant DB as Supabase DB
    participant Admin as Admin (Web)
    participant RealTime as Realtime
    
    Author->>Frontend: Fill ticket form
    Frontend->>Backend: POST /api/tickets (JWT token)
    
    Backend->>Auth: Verify JWT token
    Auth-->>Backend: ✅ Valid
    
    Backend->>TicketSvc: Create new ticket
    TicketSvc->>DB: Insert ticket record
    DB-->>TicketSvc: Ticket created with ID
    TicketSvc-->>Backend: Return ticket data
    
    Backend-->>Frontend: 201 Created
    Frontend-->>Author: ✅ Ticket submitted
    
    Frontend->>RealTime: Subscribe to ticket updates
    
    par Admin Reviews Ticket
        Admin->>Backend: GET /api/tickets/{id}
        Backend->>DB: Fetch ticket + book data
        DB-->>Backend: Return full context
        Backend-->>Admin: Display ticket details
    end
    
    par Admin AI Processing
        Admin->>Backend: POST /api/ai/classify/{id}
        Backend->>DB: Get ticket + book context
        Backend->>Backend: RAG retrieval (semantic search)
        Backend->>GroqAPI: Call LLM for classification
        GroqAPI-->>Backend: Category prediction
        Backend->>DB: Update ticket category
        Backend-->>Admin: Show classification
    end
    
    Admin->>Backend: POST /api/ai/draft/{id}
    Backend->>RAG: Retrieve relevant KB chunks
    RAG-->>Backend: 3 most relevant chunks
    Backend->>GroqAPI: Generate draft with RAG context
    GroqAPI-->>Backend: Draft response
    Backend-->>Admin: Show draft for review
    
    Admin->>Backend: POST /api/tickets/{id}/messages
    Backend->>DB: Insert admin message
    DB-->>RealTime: Broadcast update
    RealTime-->>Frontend: Message received
    Frontend-->>Author: 🔔 New message (real-time)
```

---

## Data Flows

### AI-Powered Response Generation Flow

```mermaid
graph LR
    A["1. Ticket Received<br/>Subject + Description<br/>+ Category"] 
    B["2. RAG Retrieval<br/>TF-IDF Query<br/>vs KB Chunks"]
    C["3. Semantic Ranking<br/>Cosine Similarity<br/>Top 3 Chunks"]
    D["4. Context Assembly<br/>Ticket + Book Data<br/>+ KB Chunks"]
    E["5. Groq LLM<br/>Generate Draft<br/>with Constraints"]
    F["6. Validation<br/>Format Check<br/>Length Limit"]
    G["7. Response Ready<br/>for Admin Review"]
    
    H["Fallback: Template<br/>if LLM Error"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    
    E -.->|Rate Limit/Error| H
    H --> G
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e8f5e9
    style F fill:#fce4ec
    style G fill:#c8e6c9
    style H fill:#ffcdd2
```

### Real-time Message Update Flow

```mermaid
graph LR
    A["Admin sends<br/>message"]
    B["Message stored<br/>in DB"]
    C["PostgreSQL WAL<br/>logs change"]
    D["Supabase Realtime<br/>detects change"]
    E["WebSocket broadcast<br/>to subscribed clients"]
    F["Author receives<br/>real-time update<br/>~500ms latency"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    
    style A fill:#bbdefb
    style B fill:#c5e1a5
    style C fill:#ffe0b2
    style D fill:#ffccbc
    style E fill:#f0f4c3
    style F fill:#c8e6c9
```

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ TICKETS : creates
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ NOTES : creates
    
    AUTHORS ||--o{ USERS : "has auth user"
    AUTHORS ||--o{ BOOKS : writes
    AUTHORS ||--o{ TICKETS : "raises"
    
    BOOKS ||--o{ TICKETS : related_to
    TICKETS ||--o{ MESSAGES : "contains"
    TICKETS ||--o{ NOTES : "has internal"
    
    TICKETS ||--o{ RAG_ANALYTICS : "tracked by"
    
    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role "admin|author"
        string author_id FK
        string name
        string phone
        timestamp created_at
    }
    
    AUTHORS {
        string author_id PK
        string name
        string email
        string phone
        string city
        date joined_date
        int total_books
        numeric total_royalty_earned
    }
    
    BOOKS {
        string id PK
        string author_id FK
        string title
        string isbn UK
        string genre
        date publication_date
        string status
        numeric mrp
        numeric author_royalty_per_copy
        int copies_sold
        numeric total_royalty_earned
        numeric royalty_pending
    }
    
    TICKETS {
        uuid id PK
        string author_id FK
        string subject
        text description
        string category
        string status "open|resolved|wip"
        int priority "1-5"
        string assigned_to
        timestamp created_at
        timestamp updated_at
    }
    
    MESSAGES {
        uuid id PK
        uuid ticket_id FK
        uuid sender_id FK
        text message_text
        timestamp created_at
    }
    
    NOTES {
        uuid id PK
        uuid ticket_id FK
        uuid author_id FK
        text note_text
        timestamp created_at
    }
    
    RAG_ANALYTICS {
        uuid id PK
        uuid ticket_id FK
        text query
        string category
        int chunks_retrieved
        int input_tokens
        string strategy
        timestamp created_at
    }
```

### Database Tables Detail

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM ('admin', 'author') DEFAULT 'author',
    author_id VARCHAR(50) UNIQUE REFERENCES authors(author_id),
    name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_author_id ON users(author_id);
```

#### Books Table
```sql
CREATE TABLE books (
    id VARCHAR(50) PRIMARY KEY,
    author_id VARCHAR(50) NOT NULL REFERENCES authors(author_id),
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    genre VARCHAR(100),
    publication_date DATE,
    status VARCHAR(100) DEFAULT 'In Production',
    mrp NUMERIC(10,2),
    author_royalty_per_copy NUMERIC(10,2),
    copies_sold INT DEFAULT 0,
    total_royalty_earned NUMERIC(12,2),
    royalty_paid NUMERIC(12,2) DEFAULT 0,
    royalty_pending NUMERIC(12,2),
    last_royalty_payout_date DATE,
    print_partner VARCHAR(100),
    available_on TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_books_author ON books(author_id);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_status ON books(status);
```

#### Tickets Table
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id VARCHAR(50) NOT NULL REFERENCES authors(author_id),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    priority INT DEFAULT 3,
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime for live updates
ALTER TABLE tickets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

CREATE INDEX idx_tickets_author ON tickets(author_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime + RLS
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
CREATE POLICY "allow_select_messages" ON messages FOR SELECT USING (true);
CREATE POLICY "allow_insert_messages" ON messages FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE INDEX idx_messages_ticket ON messages(ticket_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

#### RAG Analytics Table
```sql
CREATE TABLE rag_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id),
    query TEXT,
    category VARCHAR(50),
    chunks_retrieved INT,
    input_tokens INT,
    strategy VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_analytics_ticket ON rag_analytics(ticket_id);
CREATE INDEX idx_rag_analytics_created ON rag_analytics(created_at DESC);
```

---

## API Architecture

### RESTful API Endpoint Structure

```mermaid
graph TB
    API["Base URL: /api"]
    
    AUTH["🔐 /auth"]
    AUTH_LOGIN["POST /login"]
    AUTH_ME["GET /me"]
    
    TICKETS["🎫 /tickets"]
    TICKETS_LIST["GET /"]
    TICKETS_CREATE["POST /"]
    TICKETS_GET["GET /{id}"]
    TICKETS_STATUS["PATCH /{id}/status"]
    TICKETS_MSG["GET /{id}/messages"]
    TICKETS_MSG_POST["POST /{id}/messages"]
    
    AI["🤖 /ai"]
    AI_CLASSIFY["POST /classify/{ticketId}"]
    AI_PRIORITY["POST /priority/{ticketId}"]
    AI_DRAFT["POST /draft/{ticketId}"]
    AI_PROCESS["POST /process/{ticketId}"]
    
    RAG["🔍 /rag"]
    RAG_ANALYTICS["GET /analytics"]
    RAG_STATS["GET /statistics"]
    RAG_TEST["POST /test-retrieval"]
    
    ADMIN["👤 /admin/authors"]
    ADMIN_LIST["GET /"]
    ADMIN_GET["GET /{id}"]
    
    API --> AUTH
    AUTH --> AUTH_LOGIN
    AUTH --> AUTH_ME
    
    API --> TICKETS
    TICKETS --> TICKETS_LIST
    TICKETS --> TICKETS_CREATE
    TICKETS --> TICKETS_GET
    TICKETS --> TICKETS_STATUS
    TICKETS --> TICKETS_MSG
    TICKETS --> TICKETS_MSG_POST
    
    API --> AI
    AI --> AI_CLASSIFY
    AI --> AI_PRIORITY
    AI --> AI_DRAFT
    AI --> AI_PROCESS
    
    API --> RAG
    RAG --> RAG_ANALYTICS
    RAG --> RAG_STATS
    RAG --> RAG_TEST
    
    API --> ADMIN
    ADMIN --> ADMIN_LIST
    ADMIN --> ADMIN_GET
    
    style AUTH fill:#bbdefb
    style AI fill:#c8e6c9
    style RAG fill:#fff9c4
    style TICKETS fill:#ffe0b2
    style ADMIN fill:#f0f4c3
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as React Frontend
    participant Backend as Express Backend
    participant Supabase as Supabase DB
    participant Auth as Auth Service
    
    User->>Frontend: Enter email & password
    Frontend->>Backend: POST /api/auth/login {email, password}
    
    Backend->>Auth: Call authService.login()
    Auth->>Supabase: Query user by email
    Supabase-->>Auth: Return user + password_hash
    
    Alt Invalid Email
        Auth-->>Backend: Throw error
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show error
    End
    
    Alt Valid Email
        Auth->>Auth: bcrypt.compare(password, hash)
        Auth->>Auth: Generate JWT token
        Auth-->>Backend: Return {user, token}
        Backend-->>Frontend: 200 {user, token, expiresIn}
        Frontend->>Frontend: Store token in localStorage
        Frontend-->>User: Redirect to dashboard
    End
```

---

## AI/RAG Pipeline

### RAG System Architecture

```mermaid
graph TB
    A["Ticket Query<br/>Subject + Description"]
    
    B["RAG Retrieval Service"]
    B1["1. Normalize Query"]
    B2["2. Generate TF-IDF Embedding"]
    B3["3. Score Against KB Chunks"]
    B4["4. Rank by Similarity"]
    B5["5. Return Top 3 Chunks"]
    
    C["Knowledge Base<br/>6 Categories<br/>~48 Chunks"]
    C1["General Info"]
    C2["Royalty Policy"]
    C3["ISBN Allocation"]
    C4["Production Timeline"]
    C5["Distribution"]
    C6["Printing Specs"]
    
    D["Context Assembly<br/>Ticket + Book Data<br/>+ Retrieved Chunks"]
    
    E["LLM Prompt Engineering<br/>System Prompt +<br/>Context +<br/>Constraints"]
    
    F["Groq LLM API<br/>mixtral-8x7b<br/>Fast & Cheap"]
    
    G["Response Generation<br/>Draft Response"]
    
    H["Quality Checks<br/>- Format validation<br/>- Length check<br/>- Profanity filter"]
    
    I["Analytics Logging<br/>- Tokens saved<br/>- Latency<br/>- Category<br/>- Success/Failure"]
    
    J["Final Response<br/>Ready for Admin Review"]
    
    A --> B
    B --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> D
    
    C --> C1
    C --> C2
    C --> C3
    C --> C4
    C --> C5
    C --> C6
    C1 --> B2
    C2 --> B2
    C3 --> B2
    C4 --> B2
    C5 --> B2
    C6 --> B2
    
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    
    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#fce4ec
    style F fill:#c8e6c9
    style G fill:#b2dfdb
    style H fill:#f1f8e9
    style I fill:#ede7f6
    style J fill:#a5d6a7
```

### Token Optimization Comparison

```mermaid
graph LR
    A["Traditional Approach"]
    A1["Full KB (2,850 tokens)"]
    A2["+ Prompt (150 tokens)"]
    A3["= Total: 3,000 tokens"]
    A4["Cost: ~$0.00015"]
    
    B["RAG Optimized"]
    B1["Retrieve 3 chunks (250 tokens)"]
    B2["+ Prompt (150 tokens)"]
    B3["= Total: 400 tokens"]
    B4["Cost: ~$0.00002"]
    
    C["Savings"]
    C1["⬇️ Token Reduction: 87%"]
    C2["💰 Cost Reduction: 87%"]
    C3["⚡ Speed: 1.5x faster"]
    
    A --> A1 --> A2 --> A3 --> A4
    B --> B1 --> B2 --> B3 --> B4
    A4 -.->|vs| B4 --> C1 --> C2 --> C3
    
    style A fill:#ffebee
    style B fill:#e8f5e9
    style C fill:#fff9c4
```

---

## Deployment Architecture

### Current Single-Node Deployment

```mermaid
graph TB
    Internet["Internet"]
    
    Internet -->|HTTP/HTTPS| LB["Load Balancer<br/>OR Direct Connection"]
    
    Server["Ubuntu Server<br/>Port 3000"]
    
    LB --> Server
    
    Server --> Frontend["Static Files<br/>React Built App"]
    Server --> Backend["Node.js Process<br/>Express + RAG"]
    
    Backend --> Auth["Auth Service<br/>JWT + Bcrypt"]
    Backend --> RAG["RAG Service<br/>TF-IDF Embeddings"]
    Backend --> AI["AI Service<br/>Groq API Calls"]
    
    Auth --> DB["Supabase PostgreSQL<br/>- Users<br/>- Tickets<br/>- Messages"]
    RAG --> DB
    AI --> DB
    
    AI -->|API Call| GroqAPI["Groq Cloud API<br/>mixtral-8x7b"]
    
    DB --> Auth_Service["Supabase Auth<br/>Row-Level Security"]
    DB --> Realtime["Supabase Realtime<br/>WebSocket"]
    
    style Server fill:#bbdefb
    style Backend fill:#c8e6c9
    style DB fill:#fff9c4
    style GroqAPI fill:#f0f4c3
```

### Future Multi-Region Deployment

```mermaid
graph TB
    subgraph "US Region"
        US_LB["Load Balancer<br/>US"]
        US_API["API Cluster<br/>3x Nodes"]
        US_DB["PostgreSQL Replica<br/>Read"]
    end
    
    subgraph "India Region"
        IN_LB["Load Balancer<br/>India"]
        IN_API["API Cluster<br/>3x Nodes"]
        IN_DB["PostgreSQL Primary<br/>Write"]
    end
    
    subgraph "Cache Layer"
        Redis["Redis Cluster<br/>Distributed Cache"]
    end
    
    subgraph "Search Layer"
        Pinecone["Pinecone Vector DB<br/>RAG Embeddings"]
    end
    
    CDN["CDN<br/>Static Assets<br/>Cloudflare"]
    
    Users_US["Users<br/>US Region"]
    Users_India["Users<br/>India Region"]
    Users_Global["Global Users"]
    
    Users_US --> CDN
    Users_India --> CDN
    Users_Global --> CDN
    
    CDN --> US_LB
    CDN --> IN_LB
    
    US_LB --> US_API
    IN_LB --> IN_API
    
    US_API --> Redis
    IN_API --> Redis
    
    US_API --> Pinecone
    IN_API --> Pinecone
    
    US_API --> US_DB
    IN_API --> IN_DB
    
    US_DB -.->|Replication| IN_DB
    IN_DB -.->|Replication| US_DB
    
    style US_Region fill:#bbdefb
    style India_Region fill:#c8e6c9
    style Cache_Layer fill:#fff9c4
    style Search_Layer fill:#f0f4c3
```

---

## File Structure with Architecture Mapping

```
BookLeaf/
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── config/                 # Config Layer
│   │   │   ├── env.js              # Environment validation
│   │   │   ├── groq.js             # Groq client initialization
│   │   │   └── supabase.js         # Supabase client setup
│   │   │
│   │   ├── controllers/            # HTTP Layer
│   │   │   ├── auth.controller.js
│   │   │   ├── tickets.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── messages.controller.js
│   │   │   ├── books.controller.js
│   │   │   └── notes.controller.js
│   │   │
│   │   ├── services/               # Business Logic Layer
│   │   │   ├── auth.service.js     # Authentication logic
│   │   │   ├── tickets.service.js  # Ticket management
│   │   │   ├── books.service.js    # Book operations
│   │   │   ├── messages.service.js # Message handling
│   │   │   │
│   │   │   ├── ai/                 # AI Services
│   │   │   │   ├── aiClient.js     # LLM base client
│   │   │   │   ├── draft.service.js
│   │   │   │   ├── classify.service.js
│   │   │   │   ├── priority.service.js
│   │   │   │   └── process.service.js
│   │   │   │
│   │   │   └── rag/                # RAG Pipeline
│   │   │       ├── rag.service.js           # Main orchestrator
│   │   │       ├── embeddings.service.js    # TF-IDF engine
│   │   │       ├── chunking.service.js      # KB chunking
│   │   │       └── rag.analytics.js         # Metrics
│   │   │
│   │   ├── repositories/           # Data Access Layer
│   │   │   ├── user.repository.js
│   │   │   ├── ticket.repository.js
│   │   │   ├── book.repository.js
│   │   │   ├── message.repository.js
│   │   │   └── note.repository.js
│   │   │
│   │   ├── routes/                 # API Routes Layer
│   │   │   ├── auth.routes.js
│   │   │   ├── tickets.routes.js
│   │   │   ├── messages.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── rag.routes.js
│   │   │   ├── books.routes.js
│   │   │   ├── notes.routes.js
│   │   │   └── authors.routes.js
│   │   │
│   │   ├── middleware/             # Cross-Cutting Concerns
│   │   │   ├── auth.middleware.js       # JWT verification
│   │   │   ├── role.middleware.js       # Authorization
│   │   │   ├── error.middleware.js      # Error handling
│   │   │   ├── validate.middleware.js   # Input validation
│   │   │   └── rateLimit.middleware.js  # Rate limiting
│   │   │
│   │   ├── prompts/                # LLM Prompt Templates
│   │   │   ├── draft.prompt.js
│   │   │   ├── classify.prompt.js
│   │   │   ├── priority.prompt.js
│   │   │   └── process.prompt.js
│   │   │
│   │   ├── knowledge-base/         # RAG Knowledge Chunks
│   │   │   ├── general.js          # General publishing info
│   │   │   ├── royalty.js          # Royalty policies
│   │   │   ├── isbn.js             # ISBN procedures
│   │   │   ├── production.js       # Production timelines
│   │   │   ├── distribution.js     # Distribution channels
│   │   │   └── printing.js         # Printing specs
│   │   │
│   │   ├── validators/             # Input Validators
│   │   │   ├── auth.validator.js
│   │   │   ├── ticket.validator.js
│   │   │   ├── message.validator.js
│   │   │   ├── note.validator.js
│   │   │   └── book.validator.js
│   │   │
│   │   ├── utils/                  # Utilities
│   │   │   ├── logger.js           # Logging
│   │   │   ├── apiResponse.js      # Response formatting
│   │   │   ├── AppError.js         # Error class
│   │   │   ├── pagination.js       # Pagination
│   │   │   └── helpers.js          # Helper functions
│   │   │
│   │   └── app.js                  # Express app setup
│   │
│   ├── scripts/
│   │   ├── seed.js                 # Database seeding
│   │   ├── createAdmin.js          # Admin creation
│   │   └── migrate.js              # DB migrations
│   │
│   ├── docs/
│   │   ├── RAG_IMPLEMENTATION.md
│   │   ├── SUPABASE_REALTIME_SETUP.sql
│   │   └── api-overview.md
│   │
│   ├── index.js                    # Server entry
│   ├── .env                        # Env variables
│   └── package.json
│
├── client/                         # React Frontend
│   ├── src/
│   │   ├── components/             # React Components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── PriorityBadge.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── RealTimeMessages.jsx
│   │   │   └── authorComponents/
│   │   │
│   │   ├── pages/                  # Page Components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── admin/
│   │   │   ├── author/
│   │   │   └── auth/
│   │   │
│   │   ├── context/                # React Context
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/                  # Custom Hooks
│   │   │   └── useAuth.js
│   │   │
│   │   ├── services/               # API Services
│   │   │   └── api.js
│   │   │
│   │   ├── lib/                    # Libraries
│   │   │   └── supabase.js
│   │   │
│   │   ├── utils/
│   │   ├── main.jsx                # React entry
│   │   ├── App.jsx                 # Root component
│   │   └── index.css               # Global styles
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md                       # Main documentation
├── APPROACH_AND_EVOLUTION.md       # Design decisions
├── ARCHITECTURE.md                 # This file
├── IMPLEMENTATION_SUMMARY.md       # RAG implementation
└── BEFORE_AND_AFTER.md            # System evolution
```

---

## Layer Responsibilities

### Controllers (HTTP Layer)
- **Responsibility**: Parse HTTP requests, call services, format responses
- **Never**: Contains business logic, direct DB queries
- **Example**: `ticketsController.createTicket()` validates input, calls service, returns 201

### Services (Business Logic Layer)
- **Responsibility**: Orchestrate business operations, combine multiple operations
- **Manages**: Complex workflows, transactions, error recovery
- **Example**: `draftService.generate()` → retrieves context → calls RAG → calls LLM → logs analytics

### Repositories (Data Access Layer)
- **Responsibility**: Encapsulate all DB queries
- **Benefit**: Swap DB implementation without changing business logic
- **Example**: `ticketRepository.findById()` queries Supabase; could easily become MongoDB

### Middleware (Cross-Cutting Concerns)
- **Responsibility**: Auth, validation, error handling, rate limiting
- **Applied**: Globally or route-specifically
- **Example**: `authMiddleware` verifies JWT, `errorMiddleware` catches exceptions

---

## Scaling Considerations

### Current (1 Server)
- ✅ Works for <1000 DAU
- ⚠️ Single point of failure
- ✅ Easy to debug

### Next Step: Multi-Instance (6-12 months)
- Add load balancer
- Migrate to managed Redis (for rate limiting, cache)
- Add database read replicas
- Container orchestration (Docker + Kubernetes)

### Advanced: Multi-Region (1+ year)
- Regional API endpoints
- Database replication
- Vector database for RAG (Pinecone/Weaviate)
- CDN for static assets

---

## Security Architecture

### Authentication & Authorization

```mermaid
graph LR
    A["User Credentials<br/>email + password"]
    B["Bcrypt Hash<br/>10 rounds"]
    C["Verify Against<br/>Stored Hash"]
    D["Generate JWT<br/>exp: 24h"]
    E["JWT in Header<br/>Authorization: Bearer"]
    F["Middleware Verifies<br/>JWT Signature"]
    G["Check User Role<br/>admin vs author"]
    H["Access Allowed ✅"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    
    style A fill:#ffebee
    style B fill:#ffccbc
    style C fill:#ffe0b2
    style D fill:#fff9c4
    style E fill:#f1f8e9
    style F fill:#c8e6c9
    style G fill:#b2dfdb
    style H fill:#a5d6a7
```

### Row-Level Security (Database Layer)

```sql
-- Example: Authors can only see their own tickets
CREATE POLICY "authors_see_own_tickets" ON tickets
  FOR SELECT
  USING (auth.uid()::text = author_id);

-- Admins see all
CREATE POLICY "admins_see_all_tickets" ON tickets
  FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
```

---

## Error Handling Strategy

```mermaid
graph TB
    A["Request Received"]
    B{"Validation<br/>OK?"}
    C["400 Validation Error"]
    D{"Auth<br/>Token Valid?"}
    E["401 Unauthorized"]
    F{"User<br/>Authorized?"}
    G["403 Forbidden"]
    H{"Business<br/>Logic OK?"}
    I["400 Invalid Request"]
    J{"External API<br/>OK?"}
    K["500 Service Error"]
    L["200 Success"]
    
    A --> B
    B -->|No| C
    B -->|Yes| D
    D -->|No| E
    D -->|Yes| F
    F -->|No| G
    F -->|Yes| H
    H -->|No| I
    H -->|Yes| J
    J -->|No| K
    J -->|Yes| L
    
    style L fill:#a5d6a7
    style C fill:#ffccbc
    style E fill:#ffccbc
    style G fill:#ffccbc
    style I fill:#ffccbc
    style K fill:#ffccbc
```

---

**End of Architecture & Design Documentation**
