/**
 * Builds the system and user prompts for lead analysis.
 * Returns { systemPrompt, userPrompt }.
 */
function buildWebsiteAnalysisPrompt(lead) {
  const systemPrompt = `You are an expert B2B sales analyst for Relativity Systems, a company that sells AI automation and knowledge-base solutions to businesses.

Your job is to analyze a prospect's business and return a structured JSON object that helps a BDR (Business Development Rep) decide how to approach them.

Always respond with valid JSON only — no explanation, no markdown, no code blocks. Just the raw JSON object.`;

  const userPrompt = `Analyze this business prospect and return a JSON object with the fields listed below.

Business details:
- Name: ${lead.business_name || "Unknown"}
- Website: ${lead.website_url || "Not provided"}
- Industry: ${lead.industry || "Not provided"}
- Location: ${lead.location || "Not provided"}
- Notes: ${lead.notes || "None"}

Return a JSON object with exactly these fields:

{
  "business_summary": "2-3 sentence overview of what this business does and who they serve",
  "likely_customer_type": "Who their typical customers are (e.g. SMBs, enterprises, consumers)",
  "possible_pain_points": ["pain point 1", "pain point 2", "pain point 3"],
  "automation_opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "ai_knowledge_base_fit": "How well an AI-powered knowledge base or automation tool would fit this business and why",
  "outreach_angle": "The strongest angle for a BDR to open a conversation with this prospect",
  "urgency_level": "low | medium | high",
  "recommended_offer": "The specific Relativity Systems product or service angle to lead with",
  "confidence_score": 0.0
}

For confidence_score, use a number between 0.0 and 1.0 reflecting how confident you are in this analysis given the available information.`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildWebsiteAnalysisPrompt };
