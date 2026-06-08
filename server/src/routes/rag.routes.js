import express from 'express';
import ragService from '../services/rag/rag.service.js';
import ragAnalytics from '../services/rag/rag.analytics.js';
import { successResponse } from '../utils/apiResponse.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/rag/statistics
 * Get RAG knowledge base statistics
 */
router.get('/statistics', authMiddleware, (req, res, next) => {
  try {
    const stats = ragService.getKBStatistics();
    return successResponse(res, stats, 'RAG statistics retrieved');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rag/analytics
 * Get RAG performance analytics and metrics
 */
router.get('/analytics', authMiddleware, (req, res, next) => {
  try {
    const analytics = ragAnalytics.getAnalytics();
    return successResponse(res, analytics, 'RAG analytics retrieved');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rag/token-comparison
 * Compare token usage: RAG vs Full KB
 */
router.get('/token-comparison', authMiddleware, (req, res, next) => {
  try {
    const comparison = ragAnalytics.getTokenComparison();
    return successResponse(res, comparison, 'Token comparison retrieved');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rag/test-retrieval
 * Test RAG retrieval for a query (useful for debugging)
 */
router.post('/test-retrieval', authMiddleware, async (req, res, next) => {
  try {
    const { query, category, topK } = req.body;

    if (!query || !category) {
      return res.status(400).json({
        success: false,
        message: 'Query and category are required'
      });
    }

    const result = await ragService.retrieveRelevantKnowledge(
      query,
      category,
      topK || 3
    );

    return successResponse(res, result, 'RAG retrieval test completed');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rag/reset-analytics
 * Reset analytics (admin only)
 */
router.get('/reset-analytics', authMiddleware, (req, res, next) => {
  try {
    // Check if admin (optional - add role check if needed)
    ragAnalytics.resetAnalytics();
    return successResponse(res, { success: true }, 'RAG analytics reset');
  } catch (err) {
    next(err);
  }
});

export default router;
