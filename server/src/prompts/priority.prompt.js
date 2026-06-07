const getPriorityPrompt = (subject, description) => {
  return `You are a support ticket priority scorer for BookLeaf Publishing.

Assign a priority level to this support ticket.

PRIORITY LEVELS:
- critical → Financial loss, legal issue, complete blocker, payment not received 6+ months
- high     → Significant impact, time-sensitive, affects payments, book not visible
- medium   → Moderate issue, needs attention but not urgent, metadata errors
- low      → Minor issue, informational query, how-to questions

FEW-SHOT EXAMPLES:
{"subject": "Royalty not paid since 6 months, need legal action", "priority": "critical"}
{"subject": "My book disappeared from Flipkart", "priority": "high"}
{"subject": "Wrong genre listed on Amazon", "priority": "medium"}
{"subject": "How do I update my bank details?", "priority": "low"}

TICKET SUBJECT: ${subject}
TICKET DESCRIPTION: ${description}

SCORING RULES:
- Return ONLY valid JSON, nothing else
- No explanation, no markdown, no extra text
- royalty/payment/pending/not received → high/critical
- urgent/months/still waiting → bump up one level
- how to/what is/when will → low/medium
- legal/fraud/cheated → critical

RETURN FORMAT:
{"priority": "high"}`;
};

export default getPriorityPrompt;