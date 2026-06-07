import supabase from '../../config/supabase.js';
import logger from '../../utils/logger.js';

const logAICall = async (ticketId, callType, tokensUsed, source) => {
  try {
    await supabase.from('ai_audit_logs').insert({
      ticket_id: ticketId,
      call_type: callType,       // classify / priority / draft
      tokens_used: tokensUsed,
      source,                    // ai / template / manual
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Non-critical — just log, don't throw
    logger.warn('AI audit log failed', error.message);
  }
};

export { logAICall };