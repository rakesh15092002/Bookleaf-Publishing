# API Quick Reference Guide

## 📚 Full API Documentation

**View complete interactive API documentation:**

👉 **[Postman Collection - BookLeaf APIs](https://www.postman.com/workspace/My-Workspace~3fe61fd1-0725-4883-85ef-873f7c4c695f/collection/40693857-c16ff13f-9b4a-4c4f-bcd1-606b7b0e8515)**

---

## 🔑 Authentication

### Login

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@bookleaf.com",
  "password": "admin@123"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@bookleaf.com",
      "role": "admin",
      "name": "Admin User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Error**: `401 Unauthorized`
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### Get Current User

```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@bookleaf.com",
    "role": "admin",
    "name": "Admin User"
  }
}
```

---

## 🎫 Tickets

### List All Tickets

```bash
GET http://localhost:3000/api/tickets
Authorization: Bearer <token>
```

**Query Parameters**:
- `status`: Filter by status (open, resolved, wip)
- `category`: Filter by category
- `priority`: Filter by priority level
- `page`: Pagination (default: 1)
- `limit`: Items per page (default: 10)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "author_id": "AUTH001",
      "subject": "When will I receive my royalty payment?",
      "description": "It's been 3 months...",
      "category": "royalty",
      "status": "open",
      "priority": 3,
      "assigned_to": null,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

---

### Create Ticket

```bash
POST http://localhost:3000/api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "ISBN allocation delay",
  "description": "My book is ready but ISBN hasn't been assigned yet",
  "category": "isbn"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "new-ticket-uuid",
    "author_id": "AUTH001",
    "subject": "ISBN allocation delay",
    "status": "open",
    "priority": null,
    "created_at": "2025-01-15T10:35:00Z"
  }
}
```

---

### Get Ticket Details

```bash
GET http://localhost:3000/api/tickets/ticket-uuid
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "ticket-uuid",
      "author_id": "AUTH001",
      "subject": "ISBN allocation delay",
      "description": "...",
      "category": "isbn",
      "status": "open",
      "priority": 2,
      "created_at": "2025-01-15T10:30:00Z"
    },
    "author": {
      "name": "Priya Sharma",
      "email": "priya.sharma@email.com",
      "city": "Mumbai"
    },
    "book": {
      "title": "Whispers of the Ganges",
      "isbn": "978-93-5XXXX-01-1",
      "status": "Published",
      "royalty_pending": 3570
    }
  }
}
```

---

### Update Ticket Status

```bash
PATCH http://localhost:3000/api/tickets/ticket-uuid/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "resolved"
}
```

**Allowed Statuses**: `open`, `wip` (work in progress), `resolved`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "status": "resolved",
    "updated_at": "2025-01-15T10:45:00Z"
  }
}
```

---

## 💬 Messages

### Get Ticket Messages

```bash
GET http://localhost:3000/api/tickets/ticket-uuid/messages
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid-1",
      "ticket_id": "ticket-uuid",
      "sender_id": "user-uuid",
      "sender_name": "Priya Sharma",
      "message_text": "Thank you for your help!",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "msg-uuid-2",
      "ticket_id": "ticket-uuid",
      "sender_id": "admin-uuid",
      "sender_name": "Admin User",
      "message_text": "You're welcome! Your ISBN will be processed soon.",
      "created_at": "2025-01-15T10:32:00Z"
    }
  ]
}
```

---

### Add Message to Ticket

```bash
POST http://localhost:3000/api/tickets/ticket-uuid/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message_text": "This is very urgent. Please help!"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "new-msg-uuid",
    "ticket_id": "ticket-uuid",
    "sender_id": "user-uuid",
    "message_text": "This is very urgent. Please help!",
    "created_at": "2025-01-15T10:38:00Z"
  }
}
```

---

## 🤖 AI Operations (Admin Only)

### Classify Ticket

Automatically determine ticket category using AI.

```bash
POST http://localhost:3000/api/ai/classify/ticket-uuid
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "ticket_id": "ticket-uuid",
    "category": "royalty",
    "confidence": 0.92,
    "reasoning": "Mentions 'royalty payment' - classified as royalty issue",
    "ragMetadata": {
      "strategy": "category_match",
      "retrievedChunks": 3,
      "inputTokens": 385
    }
  }
}
```

---

### Score Priority

AI-based priority scoring (1-5, where 5 is highest).

```bash
POST http://localhost:3000/api/ai/priority/ticket-uuid
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "ticket_id": "ticket-uuid",
    "priority": 4,
    "reason": "Author has pending royalty payment - financially urgent",
    "ragMetadata": {
      "strategy": "context_based",
      "retrievedChunks": 2,
      "inputTokens": 320
    }
  }
}
```

---

### Generate Draft Response

Generate a templated response using RAG + LLM.

```bash
POST http://localhost:3000/api/ai/draft/ticket-uuid
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "draft": "Dear Priya,\n\nThank you for reaching out regarding your royalty payment. I understand your concern.\n\nBased on our records, your book 'Whispers of the Ganges' has earned ₹11,970 in total royalties. Of this, ₹8,400 has been paid, and ₹3,570 is pending.\n\nRoyalties are typically processed quarterly in January, April, July, and October. Your next payment is scheduled for January 15, 2025.\n\nBest regards,\nBookLeaf Support Team",
    "source": "ai",
    "ragMetadata": {
      "strategy": "category_match",
      "retrievedChunks": 3,
      "inputTokens": 385,
      "tokenSavings": "87%"
    }
  }
}
```

**Fallback (if LLM error)**:
```json
{
  "success": true,
  "data": {
    "draft": "Dear Author,\n\nThank you for your patience. We are looking into your concern and will get back to you shortly.\n\nBest regards,\nBookLeaf Support Team",
    "source": "template",
    "ragMetadata": {
      "error": "rate_limit"
    }
  }
}
```

---

### Process Ticket (Full AI Workflow)

Run classification, priority, and draft generation in one call.

```bash
POST http://localhost:3000/api/ai/process/ticket-uuid
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "classification": {
      "category": "royalty",
      "confidence": 0.92
    },
    "priority": 4,
    "draft": "Dear Priya...",
    "processing_time_ms": 2850
  }
}
```

---

## 🔍 RAG Analytics

### Get RAG Performance Analytics

```bash
GET http://localhost:3000/api/rag/analytics
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 124,
      "avgInputTokens": 385,
      "totalTokensSaved": 314000,
      "costSavings": "USD 12.56",
      "tokenReduction": "87%"
    },
    "byCategory": {
      "royalty": {
        "requests": 45,
        "avgTokens": 320,
        "savedTokens": 118800,
        "reduction": "87%"
      },
      "isbn": {
        "requests": 32,
        "avgTokens": 350,
        "savedTokens": 85680,
        "reduction": "84%"
      },
      "production": {
        "requests": 28,
        "avgTokens": 410,
        "savedTokens": 76120,
        "reduction": "83%"
      },
      "distribution": {
        "requests": 12,
        "avgTokens": 380,
        "savedTokens": 27840,
        "reduction": "86%"
      },
      "printing": {
        "requests": 7,
        "avgTokens": 295,
        "savedTokens": 5540,
        "reduction": "88%"
      }
    },
    "trends": {
      "monthlyRequests": 1240,
      "estimatedMonthlyCost": 0.49,
      "estimatedMonthlySavings": 3.71,
      "projectedYearSavings": 44.52
    }
  }
}
```

---

### Get KB Statistics

```bash
GET http://localhost:3000/api/rag/statistics
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "kbStats": {
      "totalChunks": 48,
      "totalTokens": 2850,
      "byCategory": {
        "general": { "chunks": 8, "tokens": 420 },
        "royalty": { "chunks": 12, "tokens": 680 },
        "isbn": { "chunks": 10, "tokens": 580 },
        "production": { "chunks": 9, "tokens": 640 },
        "distribution": { "chunks": 6, "tokens": 350 },
        "printing": { "chunks": 3, "tokens": 180 }
      }
    },
    "retrievalStats": {
      "avgChunksPerQuery": 3.2,
      "avgSimilarityScore": 0.78,
      "cacheHitRate": "12%"
    }
  }
}
```

---

## 👥 Admin Operations

### List All Authors

```bash
GET http://localhost:3000/api/admin/authors
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "author_id": "AUTH001",
      "name": "Priya Sharma",
      "email": "priya.sharma@email.com",
      "phone": "+91-98765-43210",
      "city": "Mumbai",
      "total_books": 2,
      "total_royalty_earned": 19908,
      "joined_date": "2023-03-15"
    }
  ]
}
```

---

### Get Author Details

```bash
GET http://localhost:3000/api/admin/authors/AUTH001
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "author": {
      "author_id": "AUTH001",
      "name": "Priya Sharma",
      "email": "priya.sharma@email.com",
      "city": "Mumbai"
    },
    "books": [
      {
        "id": "BK001",
        "title": "Whispers of the Ganges",
        "isbn": "978-93-5XXXX-01-1",
        "genre": "Literary Fiction",
        "status": "Published & Live",
        "copies_sold": 342,
        "royalty_pending": 3570
      }
    ],
    "tickets": {
      "total": 5,
      "open": 2,
      "resolved": 3
    }
  }
}
```

---

## 📊 Books

### Get All Books

```bash
GET http://localhost:3000/api/books
Authorization: Bearer <token>
```

**Query Parameters**:
- `status`: Filter by status
- `genre`: Filter by genre
- `author_id`: Filter by author

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "BK001",
      "title": "Whispers of the Ganges",
      "author": "Priya Sharma",
      "isbn": "978-93-5XXXX-01-1",
      "genre": "Literary Fiction",
      "status": "Published & Live",
      "mrp": 399,
      "copies_sold": 342,
      "royalty_pending": 3570
    }
  ]
}
```

---

## ⚠️ Common Errors

### 400 - Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": ["subject is required", "category is invalid"]
  }
}
```

### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": {
    "code": "UNAUTHORIZED",
    "statusCode": 401,
    "detail": "Missing or invalid JWT token"
  }
}
```

### 403 - Forbidden

```json
{
  "success": false,
  "message": "Forbidden",
  "error": {
    "code": "FORBIDDEN",
    "statusCode": 403,
    "detail": "Only admins can perform this action"
  }
}
```

### 404 - Not Found

```json
{
  "success": false,
  "message": "Not found",
  "error": {
    "code": "NOT_FOUND",
    "statusCode": 404,
    "detail": "Ticket not found"
  }
}
```

### 429 - Rate Limited

```json
{
  "success": false,
  "message": "Too many requests",
  "error": {
    "code": "RATE_LIMIT",
    "statusCode": 429,
    "retryAfter": 15
  }
}
```

### 500 - Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": {
    "code": "SERVER_ERROR",
    "statusCode": 500,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

---

## 📝 Authentication Header Format

All protected endpoints require:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InV1aWQiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2NzM4MzI4MDAsImV4cCI6MTY3MzkxOTIwMH0.signature
```

**Token Format**: `Bearer <jwt_token>`

---

## 🔄 Real-time Subscriptions

Subscribe to real-time updates using Supabase client:

```javascript
// In frontend React component
import { supabase } from '../lib/supabase';

useEffect(() => {
  // Subscribe to message changes
  const channel = supabase
    .channel(`ticket-${ticketId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        console.log('New message:', payload.new);
        setMessages(prev => [...prev, payload.new]);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}, [ticketId]);
```

---

## 🧪 Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bookleaf.com","password":"admin@123"}'

# Get tickets (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import the Postman collection
2. Set `{{BASE_URL}}` to `http://localhost:3000/api`
3. Set `{{TOKEN}}` variable after login
4. All subsequent requests will use the token

### Using JavaScript

```javascript
const BASE_URL = 'http://localhost:3000/api';

// Login
const loginRes = await fetch(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@bookleaf.com',
    password: 'admin@123'
  })
});

const { data } = await loginRes.json();
const token = data.token;

// Get tickets
const ticketsRes = await fetch(`${BASE_URL}/tickets`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const tickets = await ticketsRes.json();
```

---

**For more details, see:**
- [README.md](./README.md) - Setup & overview
- [APPROACH_AND_EVOLUTION.md](./APPROACH_AND_EVOLUTION.md) - Design decisions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture & diagrams
- [Postman Collection](https://www.postman.com/workspace/My-Workspace~3fe61fd1-0725-4883-85ef-873f7c4c695f/collection/40693857-c16ff13f-9b4a-4c4f-bcd1-606b7b0e8515) - Interactive API explorer
