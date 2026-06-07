const getClassifyPrompt = (subject, description) => {
  return `You are a support ticket classifier for BookLeaf Publishing, an Indian self-publishing platform.

Classify the following support ticket into EXACTLY ONE of these categories:

CATEGORIES:
1. Royalty & Payments
2. ISBN & Metadata Issues
3. Printing & Quality
4. Distribution & Availability
5. Book Status & Production Updates
6. General Inquiry

FEW-SHOT EXAMPLES:
{"subject": "My royalty payment is pending since 3 months", "category": "Royalty & Payments"}
{"subject": "My book is not showing on Amazon", "category": "Distribution & Availability"}
{"subject": "Wrong author name on book cover", "category": "Printing & Quality"}
{"subject": "When will my book go live?", "category": "Book Status & Production Updates"}
{"subject": "Need ISBN for my new book", "category": "ISBN & Metadata Issues"}

TICKET SUBJECT: ${subject}
TICKET DESCRIPTION: ${description}

RULES:
- Return ONLY valid JSON, nothing else
- No explanation, no markdown, no extra text
- Must match exactly one of the 6 categories above

RETURN FORMAT:
{"category": "Royalty & Payments"}`;
};

export default getClassifyPrompt;