const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing from environment variables.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Scores a lead from 0-100 using AI analysis of the lead data.
 * @param {Object} lead - Full lead row from Supabase (must include analysis)
 * @returns {Object} Score result JSON
 */
async function scoreLead(lead) {
  const analysis = lead.analysis || {};

  const systemPrompt = `You are a lead scoring analyst for Relativity Systems, a company that sells AI knowledge base and automation solutions to businesses.

Your job is to evaluate how likely a business prospect is to be a good fit and to convert into a customer. You score leads from 0 to 100 based on the criteria below.

Scoring criteria and max points:
- industry_fit (0-15): How well the industry typically needs structured internal knowledge or FAQs. Dental, medical, legal, property management, hospitality, home services, and multi-location service businesses are strong fits.
- ai_knowledge_base_fit (0-20): How clearly the business would benefit from an AI knowledge base based on the analysis. Look for evidence of repetitive questions, onboarding complexity, or large teams.
- pain_point_strength (0-20): How specific and believable the identified pain points are. Generic or vague pain points score lower.
- urgency (0-10): Signals that suggest the business may need a solution soon (growth, recent expansion, high staff turnover industries, etc.).
- contact_quality (0-10): Whether a real contact name and email are available. Missing both = low score here.
- business_context_quality (0-10): How much useful context is available (website, location, notes, industry). Fake/test data, placeholder websites, or very sparse info = low score.
- recommended_offer_fit (0-15): How well the recommended offer matches the business's actual situation.

Priority tiers:
- high: score 80 to 100
- medium: score 50 to 79
- low: score 0 to 49

Be realistic and critical. Do not inflate scores just because a lead exists. Penalize missing contact info, unclear fit, test/fake businesses, or vague analysis.

Always respond with valid JSON only — no explanation, no markdown, no code blocks. Just the raw JSON object.`;

  const userPrompt = `Score this lead for Relativity Systems.

Lead details:
- Business name: ${lead.business_name || "Unknown"}
- Website: ${lead.website_url || "Not provided"}
- Industry: ${lead.industry || "Not provided"}
- Location: ${lead.location || "Not provided"}
- Contact name: ${lead.contact_name || "Not provided"}
- Contact email: ${lead.contact_email || "Not provided"}
- Notes: ${lead.notes || "None"}

AI analysis results:
- Business summary: ${analysis.business_summary || "Not available"}
- Likely customer type: ${analysis.likely_customer_type || "Not available"}
- Possible pain points: ${Array.isArray(analysis.possible_pain_points) ? analysis.possible_pain_points.join(", ") : "Not available"}
- Automation opportunities: ${Array.isArray(analysis.automation_opportunities) ? analysis.automation_opportunities.join(", ") : "Not available"}
- AI knowledge base fit: ${analysis.ai_knowledge_base_fit || "Not available"}
- Outreach angle: ${analysis.outreach_angle || "Not available"}
- Urgency level: ${analysis.urgency_level || "Not available"}
- Recommended offer: ${analysis.recommended_offer || "Not available"}
- Confidence score: ${analysis.confidence_score ?? "Not available"}

Return a JSON object with exactly these fields:

{
  "score": 0,
  "priority": "low",
  "score_breakdown": {
    "industry_fit": 0,
    "ai_knowledge_base_fit": 0,
    "pain_point_strength": 0,
    "urgency": 0,
    "contact_quality": 0,
    "business_context_quality": 0,
    "recommended_offer_fit": 0
  },
  "reasoning": "2-3 sentences explaining the overall score and the main factors",
  "recommended_next_action": "One clear action the BDR should take next",
  "disqualifiers": ["list any red flags or reasons to deprioritize, or leave as empty array"]
}

score must be an integer from 0 to 100. priority must be exactly one of: high, medium, low. The score_breakdown values must add up to the total score.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;

  let scoreResult;
  try {
    scoreResult = JSON.parse(raw);
  } catch (err) {
    throw new Error("AI returned invalid JSON: " + raw);
  }

  // Always override AI priority with the authoritative calculation
  scoreResult.priority = getPriorityFromScore(scoreResult.score);

  return scoreResult;
}

function getPriorityFromScore(score) {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

module.exports = { scoreLead, getPriorityFromScore };
