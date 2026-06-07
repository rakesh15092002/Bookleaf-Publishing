import { callAIFast } from './aiClient.js';
import getPriorityPrompt from '../../prompts/priority.prompt.js';
import logger from '../../utils/logger.js';

// Predefined acceptable priority levels
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];

const score = async (ticketData) => {
  const { subject, description } = ticketData;

  try {
    logger.ai('Scoring ticket priority...', { subject });

    const prompt = getPriorityPrompt(subject, description);
    const result = await callAIFast(prompt, 50);

    // 🟢 FIX: Clean potential Markdown formatting before parsing
    // LLMs often wrap JSON in ```json ... ``` blocks
    const cleanString = result.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanString);
    
    const priority = parsed.priority;

    // Validate the extracted priority against our allowed list
    const matched = VALID_PRIORITIES.find(
      p => p.toLowerCase() === priority?.toLowerCase()
    );

    // Fallback if AI hallucinates an invalid priority
    if (!matched) {
      logger.warn('AI returned invalid priority, using fallback', { result });
      return { priority: 'medium' };
    }

    logger.ai('Priority result determined successfully', { priority: matched });
    return { priority: matched };

  } catch (error) {
    // Graceful degradation: Default to 'medium' if AI parsing completely fails
    logger.error('Priority scoring failed, falling back to medium', error.message);
    return { priority: 'medium' };
  }
};

export default { score };