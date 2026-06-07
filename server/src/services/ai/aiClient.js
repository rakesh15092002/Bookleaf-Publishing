import Groq from 'groq-sdk';
import logger from '../../utils/logger.js';

// Initialize Groq client with secure API key from environment variables
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 15000, // 15-second timeout to prevent hanging requests
  maxRetries: 0   // Disabled default retries to handle it manually with custom backoff
});

// Model routing strategy for optimal cost and performance
const MODELS = {
  FAST:  'llama-3.1-8b-instant',    // Cheap and fast for routing/classification
  SMART: 'llama-3.3-70b-versatile'  // Heavy model for high-quality empathetic drafting
}

// ─── Self-Healing: Retry with Exponential Backoff ────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async (fn, retries = 2, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    // If rate limited (429), wait and retry to prevent system failure
    if (error.status === 429 && retries > 0) {
      const waitTime = delay * (3 - retries);
      logger.warn(`Groq rate limited. Retrying in ${waitTime}ms... (${retries} attempts left)`);
      await sleep(waitTime);
      return withRetry(fn, retries - 1, delay * 2);
    }
    // Throw error to trigger graceful degradation in tickets.service.js
    throw error;
  }
}

// ─── Core AI Execution Engine ────────────────────────────
const callAI = async (model, prompt, maxTokens, temperature) => {
  return withRetry(async () => {
    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature, // Low temp for logic, medium temp for drafting
      messages: [{ role: 'user', content: prompt }]
    });

    const result = response.choices[0].message.content.trim();

    // Audit trail: Log token usage to monitor API costs
    logger.ai(`${model} token usage`, {
      input_tokens:  response.usage.prompt_tokens,
      output_tokens: response.usage.completion_tokens,
      total_tokens:  response.usage.total_tokens
    });

    return result;
  });
}

// ─── Fast Model Interface (Classification & Priority) ────
export const callAIFast = async (prompt, maxTokens = 100) => {
  try {
    // Temperature 0.1 ensures strict, deterministic JSON output without hallucinations
    return await callAI(MODELS.FAST, prompt, maxTokens, 0.1);
  } catch (error) {
    logger.error('Fast AI call failed', {
      message: error.message,
      status: error.status
    });
    throw error;
  }
}

// ─── Smart Model Interface (Draft Generation) ────────────
export const callAISmart = async (prompt, maxTokens = 400) => {
  try {
    // Temperature 0.4 provides a balance between following rules and sounding empathetic
    return await callAI(MODELS.SMART, prompt, maxTokens, 0.4);
  } catch (error) {
    logger.error('Smart AI call failed', {
      message: error.message,
      status: error.status
    });
    throw error;
  }
}