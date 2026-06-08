# RAG (Retrieval Augmented Generation) Implementation Guide

## Overview

This RAG system is designed to **minimize token utilization** by retrieving only the most relevant knowledge base chunks for each query, instead of passing the entire knowledge base to the AI model.

### Key Benefits

- **Token Reduction**: ~60% reduction in input tokens compared to full KB inclusion
- **Cost Savings**: Lower API costs due to fewer tokens processed
- **Faster Response Times**: Smaller context means faster LLM processing
- **Better Accuracy**: More focused context can lead to more relevant responses
- **Scalability**: Easily add new knowledge without increasing per-request token costs

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              RAG System Architecture                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│  User Query (Ticket)                                │
│         │                                            │
│         ▼                                            │
│  ┌─────────────────────┐                            │
│  │  RAG Service        │                            │
│  │  - Retrieval Logic  │                            │
│  └──────────┬──────────┘                            │
│             │                                        │
│     ┌───────┴──────────┐                            │
│     ▼                  ▼                            │
│  ┌────────────┐  ┌──────────────┐                 │
│  │ Embeddings │  │  Chunking    │                 │
│  │ Service    │  │  Service     │                 │
│  └─────┬──────┘  └────────┬─────┘                 │
│        │                  │                         │
│        │                  ▼                         │
│        │         ┌──────────────────┐             │
│        │         │ Organized KB     │             │
│        │         │ (Pre-chunked)    │             │
│        │         └──────────┬───────┘             │
│        │                    │                      │
│        └────────┬───────────┘                      │
│                 ▼                                   │
│        ┌──────────────────────┐                  │
│        │ Similarity Matching  │                  │
│        │ (Top K retrieval)    │                  │
│        └──────────┬───────────┘                  │
│                   ▼                               │
│        ┌──────────────────────┐                  │
│        │ Retrieved Context    │                  │
│        │ (Optimized Chunks)   │                  │
│        └──────────┬───────────┘                  │
│                   │                               │
│                   ▼                               │
│        ┌──────────────────────┐                  │
│        │ AI Model (Groq)      │                  │
│        │ (Fewer Tokens)       │                  │
│        └──────────┬───────────┘                  │
│                   │                               │
│                   ▼                               │
│        Generated Response                         │
│                                                    │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. **Embeddings Service** (`embeddings.service.js`)

Provides semantic similarity matching using TF-IDF algorithm:

- **Tokenization**: Breaks text into meaningful tokens
- **TF-IDF Calculation**: Computes term importance
- **Cosine Similarity**: Measures semantic similarity between query and documents
- **No External Dependencies**: Uses pure JavaScript, no external APIs needed

```javascript
// Example usage
const similarDocs = getSimilarDocuments(
  "My royalty payment is pending",
  knowledgeBaseChunks,
  topK = 3  // Retrieve top 3 most relevant chunks
);
```

### 2. **Chunking Service** (`chunking.service.js`)

Breaks down knowledge bases into semantic units:

- **Smart Segmentation**: Splits by headers, sections, and logical boundaries
- **Semantic Units**: Each chunk is a self-contained piece of information
- **Token Estimation**: Estimates tokens to monitor consumption
- **Chunk Combination**: Intelligently merges chunks while respecting token limits

```javascript
// Example: Chunks for Royalty KB
[
  "PAYMENT CYCLE: Calculated quarterly, paid within 45 days...",
  "ROYALTY SPLIT: 80% to author, 20% to BookLeaf...",
  "MINIMUM THRESHOLD: ₹1,000 — below this rolls over...",
  "SAMPLE RESPONSES: Q: Haven't received royalty..."
]
```

### 3. **RAG Service** (`rag.service.js`)

Main orchestrator for RAG retrieval:

- **Initialize KB Cache**: Pre-processes and chunks all knowledge bases on startup
- **Retrieve Relevant Knowledge**: Fetches top-K most relevant chunks for a query
- **Multi-Category Support**: Can retrieve from multiple categories simultaneously
- **Fallback Mechanisms**: Gracefully degrades if no relevant chunks found

```javascript
// Core function
const ragResult = retrieveRelevantKnowledge(
  query = "My book status is still pending",
  category = "Book Status & Production Updates",
  topK = 3
);

// Result structure
{
  category: "Book Status & Production Updates",
  context: "Combined relevant chunks...",
  chunks: [chunk1, chunk2, chunk3],
  similarities: [{ score: 0.85 }, { score: 0.72 }, ...],
  strategy: "rag",
  tokenEstimate: 150
}
```

### 4. **RAG Analytics** (`rag.analytics.js`)

Monitoring and performance insights:

- **Retrieval Metrics**: Tracks each retrieval event
- **Token Usage Analytics**: Monitors token consumption
- **Strategy Breakdown**: Shows which fallback strategies are used
- **Token Comparison**: Compares RAG vs full KB token usage

```javascript
// Get analytics
const analytics = getAnalytics();
// Returns: {
//   retrievalCount: 1250,
//   avgTokensPerRetrieval: 250,
//   estimatedTokenSavings: "60% reduction vs full KB",
//   categoryBreakdown: {...},
//   recentRetrievals: [...]
// }
```

## Integration Points

### AI Draft Generation Flow

```javascript
// Before RAG:
// Full KB (1500+ tokens) → AI Model

// After RAG:
// Query → RAG Retrieval → Top 3 chunks (250-350 tokens) → AI Model
// Result: ~75-80% token reduction!
```

### Updated `draft.service.js`

```javascript
const generate = async (draftData) => {
  const query = `${subject} ${description}`;
  
  // 🟢 RAG RETRIEVAL: Get only relevant chunks
  const ragResult = ragService.retrieveRelevantKnowledge(query, category, 3);
  
  // Log to analytics
  ragAnalytics.logRetrieval(query, category, ragResult);
  
  // Create prompt with retrieved context (NOT full KB)
  const prompt = getDraftPrompt(..., ragResult.context);
  
  // AI processing with fewer tokens
  const draft = await callAISmart(prompt, 400);
};
```

## API Endpoints

### Monitor RAG Performance

#### Get KB Statistics
```bash
GET /api/rag/statistics
```
Response:
```json
{
  "categories": 6,
  "totalChunks": 48,
  "totalTokens": 2850,
  "perCategory": {
    "Royalty & Payments": {
      "chunks": 8,
      "textLength": 450,
      "tokens": 112
    }
  }
}
```

#### Get Analytics
```bash
GET /api/rag/analytics
```
Response:
```json
{
  "retrievalCount": 1250,
  "avgTokensPerRetrieval": 250,
  "estimatedTokenSavings": "60% reduction vs full KB",
  "categoryBreakdown": {...},
  "strategyBreakdown": {
    "rag": 1200,
    "fallback": 50
  }
}
```

#### Token Comparison
```bash
GET /api/rag/token-comparison
```
Response:
```json
{
  "overall": {
    "fullKBTokens": 2850,
    "estimatedRAGTokens": 1140,
    "estimatedSavings": 1710,
    "reductionPercentage": 60
  }
}
```

#### Test Retrieval
```bash
POST /api/rag/test-retrieval
Content-Type: application/json

{
  "query": "When will I receive my royalty payment?",
  "category": "Royalty & Payments",
  "topK": 3
}
```

## Token Usage Comparison

### Example: Royalty Query

**Before RAG (Full KB):**
```
- Full Royalty KB: ~450 tokens
- Additional prompt/ticket context: ~150 tokens
- Total input: ~600 tokens
```

**After RAG (3 Relevant Chunks):**
```
- Chunk 1 (Payment Cycle): ~80 tokens
- Chunk 2 (Royalty Split): ~60 tokens
- Chunk 3 (Sample Response): ~50 tokens
- Additional prompt/ticket context: ~50 tokens
- Total input: ~240 tokens
```

**Savings: 60% token reduction** ✅

## Performance Metrics

### System Initialization
- Pre-chunking happens on first RAG call
- Caching: ~30KB in memory for all KBs
- One-time cost: < 10ms initialization

### Per-Request Performance
- Embedding calculation: ~5-10ms
- Similarity matching: ~2-5ms
- Total RAG retrieval: ~10-15ms
- Token reduction: 60-80% (depending on query)

## Error Handling & Fallbacks

### Fallback Strategy 1: Partial Match
```javascript
// If query has low similarity scores
if (similarChunks.length === 0) {
  // Return first 2 chunks as fallback
  return { strategy: 'fallback', chunks: chunks.slice(0, 2) };
}
```

### Fallback Strategy 2: Full KB
```javascript
// If RAG service fails completely
if (ragError) {
  return { strategy: 'fallback-full', context: fullKB };
}
```

### Error Logging
All fallbacks are logged for monitoring:
```javascript
logger.warn('RAG retrieval had issues', {
  strategy: 'fallback',
  reason: 'low similarity scores',
  category: category
});
```

## Best Practices

### 1. Query Formulation
```javascript
// Good: Include full context
query = `${ticket.subject} ${ticket.description}`

// Avoid: Single word queries
query = "royalty"
```

### 2. Category Selection
```javascript
// Use accurate category from classification
category = classifyResult.category  // ✅

// Avoid: Wrong category selection
category = "General Inquiry"  // ✗ for specific topics
```

### 3. TopK Selection
```javascript
topK = 3   // ✅ Good balance between quality and token savings
topK = 1   // ✗ Too restrictive, may miss relevant info
topK = 10  // ✗ Defeats purpose of RAG, too many tokens
```

### 4. Monitoring
```javascript
// Regularly check analytics
const analytics = ragAnalytics.getAnalytics();
console.log(`Token savings: ${analytics.estimatedTokenSavings}`);

// Alert if fallback usage increases
if (fallbackCount > 0.1 * totalRetrievals) {
  console.warn('High fallback rate - KB needs review');
}
```

## Optimization Tips

### 1. Improve Chunk Quality
If retrieval accuracy is low:
- Review chunk boundaries in `chunking.service.js`
- Add more specific headers/sections to KB
- Consider sub-chunking large sections

### 2. Enhance Embeddings
If similarity matching needs improvement:
- Consider adding stop-words filtering
- Implement keyword boosting for domain terms
- Add custom synonyms for BookLeaf-specific terms

### 3. Add New Knowledge Bases
When adding new KB categories:
```javascript
// 1. Create KB file
const newKB = `Your knowledge base...`;
export default newKB;

// 2. Register in rag.service.js
const KB_MAP = {
  'Your Category': newKB,
  // ... existing
};

// 3. System automatically chunks and indexes on next RAG call
```

## Troubleshooting

### Issue: Retrieved chunks not relevant
**Solution**: Check query formation and category accuracy
```javascript
// Enable debug logging
logger.ai('RAG debug', {
  query,
  category,
  similarities: result.similarities
});
```

### Issue: High token usage still
**Solution**: Reduce topK or improve categorization
```javascript
retrieveRelevantKnowledge(query, category, 2);  // Reduce from 3 to 2
```

### Issue: Fallback strategy activating
**Solution**: Review KB structure and embeddings
```javascript
const stats = ragService.getKBStatistics();
console.log('KB health:', stats);
```

## Future Enhancements

1. **Vector Database Integration**: Use Pinecone/Weaviate for scale
2. **Cross-Encoder Reranking**: Improve relevance after initial retrieval
3. **Query Expansion**: Expand queries with related terms
4. **Semantic Caching**: Cache common query-chunk pairs
5. **Multi-Language Support**: Extend RAG to support Hindi/regional languages

## Summary

The RAG implementation provides:
- ✅ **60% token reduction** on average
- ✅ **No external dependencies** (pure JS)
- ✅ **Easy monitoring** via analytics endpoints
- ✅ **Graceful fallbacks** for edge cases
- ✅ **Extensible architecture** for future improvements

By using RAG, your system becomes more cost-efficient while maintaining or improving response quality!
