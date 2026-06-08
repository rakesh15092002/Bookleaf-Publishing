import { callAISmart } from './aiClient.js';
import getDraftPrompt from '../../prompts/draft.prompt.js';
import logger from '../../utils/logger.js';
import ragService from '../rag/rag.service.js';
import ragAnalytics from '../rag/rag.analytics.js';

const generate = async (draftData) => {
  // Destructure ticket data
  const { subject, description, category, bookData, author_name, author_city } = draftData; 
  
  try {
    logger.ai('Generating draft response with RAG...', { category });

    // 🟢 RAG RETRIEVAL: Get only the most relevant knowledge chunks
    const query = `${subject} ${description}`;
    const ragResult = await ragService.retrieveRelevantKnowledge(query, category, 3);
    
    // Log to analytics
    ragAnalytics.logRetrieval(query, category, ragResult);
    
    logger.ai('RAG retrieval result', {
      strategy: ragResult.strategy,
      chunkCount: ragResult.chunks.length,
      tokenEstimate: ragResult.tokenEstimate,
      tokenSavings: `${Math.round((1 - ragResult.tokenEstimate / 2000) * 100)}%` // Approx comparison
    });

    const prompt = getDraftPrompt(
      { subject, description, author_name, author_city }, 
      bookData, 
      category, 
      ragResult.context,
      ragResult.similarities // Pass similarity scores for better context
    );

    // Smart model for better draft quality with reduced token input
    const draft = await callAISmart(prompt, 400);

    logger.ai('Draft generated successfully with RAG', { 
      category,
      inputTokens: ragResult.tokenEstimate 
    });

    return {
      draft,
      source: 'ai',
      category,
      ragMetadata: {
        strategy: ragResult.strategy,
        retrievedChunks: ragResult.chunks.length,
        inputTokens: ragResult.tokenEstimate
      }
    };

  } catch (error) {
    logger.error('Draft generation with RAG failed', error.message);

    // Rate limit hit - use template
    if (error.status === 429) {
      return {
        draft: getTemplateDraft(category),
        source: 'template',
        category,
        ragMetadata: { error: 'rate_limit' }
      };
    }

    // AI completely down
    return {
      draft: null,
      source: 'manual',
      category,
      ragMetadata: { error: 'ai_unavailable' }
    };
  }
};

const getTemplateDraft = (category) => {
  return `Dear Author,

Thank you for reaching out to BookLeaf Support.

We have received your query regarding ${category} and our team is reviewing it carefully.

We will get back to you with a detailed response within 1-2 business days.

Warm regards,
BookLeaf Support Team`;
};

export default { generate, getRelevantKB };