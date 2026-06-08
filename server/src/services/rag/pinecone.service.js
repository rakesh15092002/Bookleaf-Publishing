/**
 * Pinecone RAG Service
 * Optional Pinecone-backed retrieval layer for the RAG system.
 */

import { PineconeClient } from '@pinecone-database/pinecone';
import chunkingService from './chunking.service.js';
import logger from '../../utils/logger.js';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'bookleaf-rag';
const USE_PINECONE = process.env.USE_PINECONE === 'true';

let pineconeClient;
let pineconeIndex;
let initialized = false;
let vectorStorePrepared = false;
let vocabulary = [];
let idfMap = {};

const tokenize = (text) => {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
};

const buildVocabulary = (documents, maxSize = 512) => {
  const frequency = {};
  const tokenized = documents.map(text => tokenize(text));

  tokenized.forEach(tokens => {
    tokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1;
    });
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSize)
    .map(([token]) => token);
};

const calculateIdf = (documents, vocab) => {
  const totalDocs = documents.length;
  const tokenizedDocs = documents.map(text => new Set(tokenize(text)));

  return vocab.reduce((acc, token) => {
    const docCount = tokenizedDocs.reduce(
      (count, docTokens) => count + (docTokens.has(token) ? 1 : 0),
      0
    );

    acc[token] = Math.log((totalDocs + 1) / (1 + docCount)) + 1;
    return acc;
  }, {});
};

const vectorize = (text, vocab, idf) => {
  const tokens = tokenize(text);
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });

  const totalTokens = tokens.length || 1;
  return vocab.map(token => {
    const value = tf[token] || 0;
    return value === 0 ? 0 : (value / totalTokens) * (idf[token] || 1);
  });
};

const initClient = async () => {
  if (!USE_PINECONE) {
    return false;
  }

  if (!PINECONE_API_KEY || !PINECONE_ENVIRONMENT) {
    logger.warn('Pinecone is enabled, but API key or environment is missing. Falling back to local RAG.');
    return false;
  }

  if (initialized) {
    return true;
  }

  try {
    pineconeClient = new PineconeClient();
    await pineconeClient.init({
      apiKey: PINECONE_API_KEY,
      environment: PINECONE_ENVIRONMENT
    });

    const existingIndexes = await pineconeClient.listIndexes();
    if (!existingIndexes.includes(PINECONE_INDEX_NAME)) {
      logger.info('Pinecone index not found. Creating index...', { index: PINECONE_INDEX_NAME });
      await pineconeClient.createIndex({
        createRequest: {
          name: PINECONE_INDEX_NAME,
          dimension: 512,
          metric: 'cosine'
        }
      });
    }

    pineconeIndex = pineconeClient.Index(PINECONE_INDEX_NAME);
    initialized = true;
    logger.info('Pinecone client initialized', { index: PINECONE_INDEX_NAME });
    return true;
  } catch (error) {
    logger.error('Failed to initialize Pinecone client', error.message);
    return false;
  }
};

const prepareVectors = (kbMap) => {
  const allChunks = [];
  Object.entries(kbMap).forEach(([category, kbText]) => {
    const chunks = chunkingService.chunkKnowledgeBase(kbText);
    chunks.forEach((text, index) => {
      allChunks.push({
        id: `${category}-${index}`,
        category,
        text
      });
    });
  });

  const documents = allChunks.map(item => item.text);
  vocabulary = buildVocabulary(documents, 512);
  idfMap = calculateIdf(documents, vocabulary);

  return allChunks.map(item => ({
    id: item.id,
    values: vectorize(item.text, vocabulary, idfMap),
    metadata: {
      category: item.category,
      text: item.text
    }
  }));
};

const upsertKB = async (kbMap) => {
  if (!pineconeIndex) return false;

  const vectors = prepareVectors(kbMap);
  if (vectors.length === 0) {
    logger.warn('No KB chunks found when preparing Pinecone vectors.');
    return false;
  }

  try {
    const batchSize = 10;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const chunk = vectors.slice(i, i + batchSize);
      await pineconeIndex.upsert({ upsertRequest: { vectors: chunk } });
    }

    logger.info('Pinecone KB indexed successfully', { items: vectors.length });
    return true;
  } catch (error) {
    logger.error('Failed to upsert vectors into Pinecone', error.message);
    return false;
  }
};

const retrieveRelevantKnowledge = async (query, category, topK = 3) => {
  if (!USE_PINECONE) {
    throw new Error('Pinecone is not enabled');
  }

  const ready = await initClient();
  if (!ready) {
    throw new Error('Pinecone initialization failed');
  }

  if (!vocabulary.length || !idfMap || !pineconeIndex) {
    throw new Error('Pinecone vector store is not prepared');
  }

  try {
    const vector = vectorize(query, vocabulary, idfMap);
    const queryRequest = {
      vector,
      topK,
      includeMetadata: true,
      includeValues: false,
      filter: {
        category: { $eq: category }
      }
    };

    const response = await pineconeIndex.query({ queryRequest });
    const matches = response.matches || [];

    const retrievedChunks = matches
      .filter(match => match.metadata?.text)
      .map(match => match.metadata.text);

    if (retrievedChunks.length === 0) {
      logger.warn('Pinecone query returned no matches', { category, query });
      return null;
    }

    return {
      category,
      context: chunkingService.combineChunks(retrievedChunks),
      chunks: retrievedChunks,
      similarities: matches.map(match => ({
        score: match.score?.toFixed(3) ?? '0.000',
        preview: String(match.metadata?.text || '').substring(0, 50) + '...'
      })),
      strategy: 'pinecone',
      tokenEstimate: chunkingService.estimateTokenCount(chunkingService.combineChunks(retrievedChunks))
    };
  } catch (error) {
    logger.error('Pinecone query failed', error.message);
    return null;
  }
};

const initializePineconeKB = async (kbMap) => {
  const ready = await initClient();
  if (!ready) return false;
  if (vectorStorePrepared) {
    return true;
  }

  const prepared = await upsertKB(kbMap);
  if (prepared) {
    vectorStorePrepared = true;
  }

  return prepared;
};

export default {
  USE_PINECONE,
  initializePineconeKB,
  retrieveRelevantKnowledge
};
