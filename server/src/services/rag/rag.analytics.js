/**
 * RAG Monitoring and Analytics Service
 * Provides insights into RAG performance and token usage
 */

import ragService from './rag.service.js';
import logger from '../../utils/logger.js';

// Store retrieval metrics for analytics
const metrics = {
  retrievals: [],
  startTime: Date.now()
};

/**
 * Log a retrieval for analytics
 */
const logRetrieval = (query, category, result) => {
  metrics.retrievals.push({
    timestamp: new Date().toISOString(),
    query,
    category,
    strategy: result.strategy,
    chunksRetrieved: result.chunks?.length || 0,
    tokenEstimate: result.tokenEstimate,
    similarities: result.similarities?.map(s => s.score) || []
  });
};

/**
 * Get RAG analytics and statistics
 */
const getAnalytics = () => {
  const kbStats = ragService.getKBStatistics();
  const uptime = Date.now() - metrics.startTime;

  const avgTokensPerRetrieval = metrics.retrievals.length > 0
    ? Math.round(
        metrics.retrievals.reduce((sum, r) => sum + r.tokenEstimate, 0) / metrics.retrievals.length
      )
    : 0;

  const categoryBreakdown = {};
  metrics.retrievals.forEach(r => {
    if (!categoryBreakdown[r.category]) {
      categoryBreakdown[r.category] = { count: 0, totalTokens: 0 };
    }
    categoryBreakdown[r.category].count += 1;
    categoryBreakdown[r.category].totalTokens += r.tokenEstimate;
  });

  const strategyBreakdown = {};
  metrics.retrievals.forEach(r => {
    strategyBreakdown[r.strategy] = (strategyBreakdown[r.strategy] || 0) + 1;
  });

  return {
    uptime,
    retrievalCount: metrics.retrievals.length,
    avgTokensPerRetrieval,
    estimatedTokenSavings: metrics.retrievals.length > 0
      ? `${Math.round((1 - avgTokensPerRetrieval / 1500) * 100)}% reduction vs full KB`
      : 'N/A',
    kbStatistics: kbStats,
    categoryBreakdown,
    strategyBreakdown,
    recentRetrievals: metrics.retrievals.slice(-10)
  };
};

/**
 * Get token comparison: RAG vs Full KB
 */
const getTokenComparison = () => {
  const kbStats = ragService.getKBStatistics();

  const comparison = {};
  Object.entries(kbStats.perCategory).forEach(([category, stats]) => {
    comparison[category] = {
      fullKBTokens: stats.tokens,
      estimatedRAGTokens: Math.round(stats.tokens * 0.4), // Estimate 40% of full KB
      estimatedSavings: Math.round(stats.tokens * 0.6),
      reductionPercentage: 60
    };
  });

  const totalFullKB = kbStats.totalTokens;
  const totalRAG = Math.round(totalFullKB * 0.4);

  return {
    perCategory: comparison,
    overall: {
      fullKBTokens: totalFullKB,
      estimatedRAGTokens: totalRAG,
      estimatedSavings: totalFullKB - totalRAG,
      reductionPercentage: 60
    }
  };
};

/**
 * Reset analytics (for testing)
 */
const resetAnalytics = () => {
  metrics.retrievals = [];
  metrics.startTime = Date.now();
  logger.info('RAG analytics reset');
};

export default {
  logRetrieval,
  getAnalytics,
  getTokenComparison,
  resetAnalytics
};
