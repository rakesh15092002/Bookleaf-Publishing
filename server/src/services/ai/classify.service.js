import { callAIFast } from './aiClient.js';
import getClassifyPrompt from '../../prompts/classify.prompt.js';
import logger from '../../utils/logger.js';
import ragService from '../rag/rag.service.js';
import ragAnalytics from '../rag/rag.analytics.js';

// Strict array of BookLeaf knowledge base categories
const VALID_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

const classify = async (ticketData) => {
  const { subject, description } = ticketData;

  try {
    logger.ai('Classifying ticket category with RAG context...', { subject });

    const prompt = getClassifyPrompt(subject, description);
    const result = await callAIFast(prompt, 50);

    // 🟢 CLEAN: Clean potential Markdown formatting before parsing
    const cleanString = result.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanString);
    
    const category = parsed.category;

    // Validate the AI's output against our strict category list
    const matched = VALID_CATEGORIES.find(
      cat => cat.toLowerCase() === category?.toLowerCase()
    );

    // Fallback if AI invents a non-existent category
    if (!matched) {
      logger.warn('AI returned invalid category, using fallback', { result });
      return { category: 'General Inquiry' };
    }

    // 🟢 LOG RAG CLASSIFICATION: Log this classification for analytics
    ragAnalytics.logRetrieval(
      `${subject} ${description}`,
      matched,
      {
        chunks: [],
        strategy: 'classification',
        tokenEstimate: 50
      }
    );

    logger.ai('Classification result determined successfully', { 
      category: matched,
      source: 'ai' 
    });

    return { category: matched };

  } catch (error) {
    // Graceful degradation: Default to 'General Inquiry' if AI parsing fails
    logger.error('Classification failed, falling back to General Inquiry', error.message);
    return { category: 'General Inquiry' };
  }
};

export default { classify };