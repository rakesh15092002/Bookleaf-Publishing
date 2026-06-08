/**
 * RAG (Retrieval Augmented Generation) Service
 * Core service for intelligent knowledge retrieval to minimize tokens
 */

import embeddingsService from './embeddings.service.js';
import chunkingService from './chunking.service.js';
import pineconeService from './pinecone.service.js';
import logger from '../../utils/logger.js';

// Import all knowledge bases
import royaltyKB from '../../knowledge-base/royalty.js';
import isbnKB from '../../knowledge-base/isbn.js';
import printingKB from '../../knowledge-base/printing.js';
import distributionKB from '../../knowledge-base/distribution.js';
import productionKB from '../../knowledge-base/production.js';
import generalKB from '../../knowledge-base/general.js';

// Map categories to their knowledge bases
const KB_MAP = {
  'Royalty & Payments': royaltyKB,
  'ISBN & Metadata Issues': isbnKB,
  'Printing & Quality': printingKB,
  'Distribution & Availability': distributionKB,
  'Book Status & Production Updates': productionKB,
  'General Inquiry': generalKB
};

// Cache for organized knowledge bases (initialized on first use)
let kbCache = null;

/**
 * Initialize and organize all knowledge bases
 */
const initializeKBCache = () => {
  if (kbCache) return kbCache;

  logger.info('Initializing RAG knowledge base cache...');

  kbCache = chunkingService.organizeAllKnowledgeBases(KB_MAP);

  const totalChunks = Object.values(kbCache).reduce((sum, kb) => sum + kb.chunkCount, 0);
  logger.info('RAG cache initialized', {
    categories: Object.keys(kbCache).length,
    totalChunks,
    memory: `${Math.round(JSON.stringify(kbCache).length / 1024)}KB`
  });

  return kbCache;
};

/**
 * Retrieve most relevant knowledge for a query and category
 * @param {string} query - The user query/ticket
 * @param {string} category - The ticket category
 * @param {number} topK - Number of chunks to retrieve
 * @returns {Object} Retrieved knowledge with metadata
 */
const retrieveRelevantKnowledge = async (query, category, topK = 3) => {
  try {
    const cache = initializeKBCache();

    if (!cache[category]) {
      logger.warn(`Category not found in KB: ${category}, using General Inquiry`);
      category = 'General Inquiry';
    }

    if (pineconeService.USE_PINECONE) {
      await pineconeService.initializePineconeKB(KB_MAP);
      const pineconeResult = await pineconeService.retrieveRelevantKnowledge(query, category, topK);
      if (pineconeResult) {
        logger.ai('Pinecone RAG retrieval successful', {
          category,
          chunkRetrieved: pineconeResult.chunks.length,
          strategy: pineconeResult.strategy,
          tokenEstimate: pineconeResult.tokenEstimate
        });
        return pineconeResult;
      }

      logger.warn('Pinecone RAG retrieval failed, falling back to local RAG');
    }

    const categoryKB = cache[category];
    const chunks = categoryKB.chunks;

    // Retrieve most relevant chunks using embeddings
    const similarChunks = embeddingsService.getSimilarDocuments(query, chunks, topK);

    if (similarChunks.length === 0) {
      logger.warn(`No relevant chunks found for query in category: ${category}`);
      // Fallback: return first few chunks
      return {
        category,
        context: chunkingService.combineChunks(chunks.slice(0, 2)),
        chunks: chunks.slice(0, 2),
        strategy: 'fallback',
        tokenEstimate: chunkingService.estimateTokenCount(
          chunkingService.combineChunks(chunks.slice(0, 2))
        )
      };
    }

    const retrievedChunks = similarChunks.map(item => item.document);
    const combinedContext = chunkingService.combineChunks(retrievedChunks);

    logger.ai('RAG retrieval successful', {
      category,
      chunkRetrieved: similarChunks.length,
      averageSimilarity: (
        similarChunks.reduce((sum, item) => sum + item.score, 0) / similarChunks.length
      ).toFixed(3),
      tokenEstimate: chunkingService.estimateTokenCount(combinedContext)
    });

    return {
      category,
      context: combinedContext,
      chunks: retrievedChunks,
      similarities: similarChunks.map(item => ({
        score: item.score.toFixed(3),
        preview: item.document.substring(0, 50) + '...'
      })),
      strategy: 'rag',
      tokenEstimate: chunkingService.estimateTokenCount(combinedContext)
    };
  } catch (error) {
    logger.error('RAG retrieval failed', error.message);

    // Fallback: return full KB for the category
    const fullKB = KB_MAP[category] || KB_MAP['General Inquiry'];
    return {
      category: category || 'General Inquiry',
      context: fullKB,
      chunks: [fullKB],
      strategy: 'fallback-full',
      tokenEstimate: chunkingService.estimateTokenCount(fullKB),
      error: error.message
    };
  }
};

/**
 * Retrieve knowledge for multiple categories (useful for multi-category tickets)
 */
const retrieveMultiCategoryKnowledge = async (query, categories, topKPerCategory = 2) => {
  try {
    const results = {};
    let totalTokens = 0;

    for (const category of categories) {
      const result = await retrieveRelevantKnowledge(query, category, topKPerCategory);
      results[category] = result;
      totalTokens += result.tokenEstimate;
    }

    logger.ai('Multi-category RAG retrieval completed', {
      categoriesCount: categories.length,
      totalTokenEstimate: totalTokens
    });

    return {
      results,
      totalTokenEstimate: totalTokens,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Multi-category RAG retrieval failed', error.message);
    throw error;
  }
};

/**
 * Get KB statistics for monitoring and optimization
 */
const getKBStatistics = () => {
  const cache = initializeKBCache();
  const stats = {};

  Object.entries(cache).forEach(([category, kb]) => {
    stats[category] = {
      chunks: kb.chunkCount,
      textLength: kb.fullText.length,
      avgChunkSize: Math.round(kb.fullText.length / kb.chunkCount),
      tokens: chunkingService.estimateTokenCount(kb.fullText)
    };
  });

  return {
    categories: Object.keys(stats).length,
    totalChunks: Object.values(stats).reduce((sum, s) => sum + s.chunks, 0),
    totalTokens: Object.values(stats).reduce((sum, s) => sum + s.tokens, 0),
    perCategory: stats
  };
};

export default {
  initializeKBCache,
  retrieveRelevantKnowledge,
  retrieveMultiCategoryKnowledge,
  getKBStatistics
};
