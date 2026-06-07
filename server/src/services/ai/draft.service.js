import { callAISmart } from './aiClient.js';
import getDraftPrompt from '../../prompts/draft.prompt.js';
import logger from '../../utils/logger.js';

import royaltyKB from '../../knowledge-base/royalty.js';
import isbnKB from '../../knowledge-base/isbn.js';
import printingKB from '../../knowledge-base/printing.js';
import distributionKB from '../../knowledge-base/distribution.js';
import productionKB from '../../knowledge-base/production.js';
import generalKB from '../../knowledge-base/general.js';

const getRelevantKB = (category) => {
  const kbMap = {
    'Royalty & Payments':               royaltyKB,
    'ISBN & Metadata Issues':           isbnKB,
    'Printing & Quality':               printingKB,
    'Distribution & Availability':      distributionKB,
    'Book Status & Production Updates': productionKB,
    'General Inquiry':                  generalKB
  };

  return kbMap[category] || generalKB;
};

const generate = async (draftData) => {
  // 🟢 FIX 1: author_name aur author_city destructured 
  const { subject, description, category, bookData, author_name, author_city } = draftData; 
  
  try {
    logger.ai('Generating draft response...', { category });

    const relevantKB = getRelevantKB(category);
    
    const prompt = getDraftPrompt(
      { subject, description, author_name, author_city }, 
      bookData, 
      category, 
      relevantKB
    );

    // Smart model for better draft quality
    const draft = await callAISmart(prompt, 400);

    logger.ai('Draft generated successfully', { category });

    return {
      draft,
      source: 'ai',
      category
    };

  } catch (error) {
    logger.error('Draft generation failed', error.message);

    // Rate limit hit
    if (error.status === 429) {
      return {
        draft: getTemplateDraft(category),
        source: 'template',
        category
      };
    }

    // AI completely down
    return {
      draft: null,
      source: 'manual',
      category
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