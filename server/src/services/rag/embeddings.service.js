/**
 * Embeddings Service - Lightweight embedding generation using TF-IDF
 * Provides semantic similarity matching for RAG retrieval
 */

import logger from '../../utils/logger.js';

/**
 * Tokenize text into words
 */
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2); // Remove short tokens
};

/**
 * Calculate TF-IDF scores for a corpus
 */
const calculateTFIDF = (documents) => {
  const allTokens = new Set();
  const tokenizedDocs = [];

  // Tokenize all documents and collect unique tokens
  documents.forEach(doc => {
    const tokens = tokenize(doc);
    tokenizedDocs.push(tokens);
    tokens.forEach(token => allTokens.add(token));
  });

  // Calculate IDF (Inverse Document Frequency)
  const idf = {};
  allTokens.forEach(token => {
    const docsWithToken = tokenizedDocs.filter(doc => doc.includes(token)).length;
    idf[token] = Math.log(documents.length / (1 + docsWithToken));
  });

  // Calculate TF-IDF vectors
  const vectors = tokenizedDocs.map(tokens => {
    const vector = {};
    const tf = {};

    // Calculate term frequency
    tokens.forEach(token => {
      tf[token] = (tf[token] || 0) + 1;
    });

    // Calculate TF-IDF
    Object.keys(tf).forEach(token => {
      vector[token] = (tf[token] / tokens.length) * idf[token];
    });

    return vector;
  });

  return { vectors, idf, tokenizedDocs };
};

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vec1, vec2) => {
  const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  allKeys.forEach(key => {
    const val1 = vec1[key] || 0;
    const val2 = vec2[key] || 0;

    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

/**
 * Generate embedding for query text
 */
const generateQueryEmbedding = (query, idf) => {
  const tokens = tokenize(query);
  const vector = {};

  tokens.forEach(token => {
    vector[token] = (idf[token] || 0.1); // Default IDF for unknown tokens
  });

  return vector;
};

/**
 * Find most similar documents to query
 */
const getSimilarDocuments = (query, documents, topK = 3) => {
  try {
    const { vectors, idf } = calculateTFIDF(documents);
    const queryEmbedding = generateQueryEmbedding(query, idf);

    // Calculate similarities
    const similarities = vectors.map((vector, idx) => ({
      index: idx,
      score: cosineSimilarity(queryEmbedding, vector),
      document: documents[idx]
    }));

    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(item => item.score > 0); // Only return if there's some similarity
  } catch (error) {
    logger.error('Embeddings similarity calculation failed', error.message);
    return [];
  }
};

export default {
  tokenize,
  calculateTFIDF,
  cosineSimilarity,
  generateQueryEmbedding,
  getSimilarDocuments
};
