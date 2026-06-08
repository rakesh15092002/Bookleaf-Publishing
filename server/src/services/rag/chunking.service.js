/**
 * Knowledge Base Chunking Service
 * Breaks down knowledge base into semantic chunks for RAG retrieval
 */

import logger from '../../utils/logger.js';

/**
 * Chunk knowledge base into semantic units
 * Splits by headers, sections, and logical boundaries
 */
const chunkKnowledgeBase = (kbText) => {
  if (!kbText || typeof kbText !== 'string') {
    logger.warn('Invalid KB text provided to chunking service');
    return [];
  }

  const chunks = [];
  let currentSection = '';

  // Split by newlines and process
  const lines = kbText.split('\n').filter(line => line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect section headers (numbered, dashes, etc.)
    const isHeader = /^(\d+\.|^-|^#+|^[A-Z][A-Z\s]+:)/.test(line);

    if (isHeader && currentSection.trim().length > 20) {
      // Save previous section if it has meaningful content
      chunks.push(currentSection.trim());
      currentSection = line;
    } else {
      currentSection += '\n' + line;
    }
  }

  // Add last section
  if (currentSection.trim().length > 20) {
    chunks.push(currentSection.trim());
  }

  // Filter empty chunks
  return chunks
    .filter(chunk => chunk.length > 30)
    .map(chunk => chunk.trim());
};

/**
 * Organize all knowledge bases into a searchable format
 */
const organizeAllKnowledgeBases = (kbMap) => {
  const organized = {};

  Object.entries(kbMap).forEach(([category, kbText]) => {
    organized[category] = {
      fullText: kbText,
      chunks: chunkKnowledgeBase(kbText),
      chunkCount: 0 // Will be set below
    };

    organized[category].chunkCount = organized[category].chunks.length;

    logger.info(`KB organized for category: ${category}`, {
      totalChunks: organized[category].chunkCount,
      textLength: kbText.length
    });
  });

  return organized;
};

/**
 * Combine multiple chunks into optimized context
 * Merges related chunks while managing token count
 */
const combineChunks = (chunks, maxLength = 2000) => {
  if (chunks.length === 0) return '';

  let combined = '';
  let totalLength = 0;

  for (const chunk of chunks) {
    const chunkLength = chunk.length;

    if (totalLength + chunkLength <= maxLength) {
      combined += chunk + '\n\n';
      totalLength += chunkLength + 2; // +2 for newlines
    } else if (combined.length === 0) {
      // If even first chunk exceeds limit, include it anyway (better than nothing)
      combined = chunk + '\n\n';
      break;
    } else {
      break; // Stop adding if we exceed limit
    }
  }

  return combined.trim();
};

/**
 * Calculate token estimation (rough approximation)
 * 1 token ≈ 4 characters (average for English)
 */
const estimateTokenCount = (text) => {
  return Math.ceil(text.length / 4);
};

export default {
  chunkKnowledgeBase,
  organizeAllKnowledgeBases,
  combineChunks,
  estimateTokenCount
};
