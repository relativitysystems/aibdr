/**
 * Builds the system and user prompts for generating a cold outreach email.
 * Returns { systemPrompt, userPrompt }.
 */
function buildOutreachPrompt(lead) {
  const analysis = lead.analysis || {};

  const systemPrompt = `You are a skilled B2B sales copywriter for Relativity Systems.

Relativity Systems helps businesses turn SOPs, FAQs, policies, training docs, call transcripts, and internal knowledge into an AI knowledge base that employees can query. The system provides clear answers with source citations, helping teams reduce repetitive questions, speed up onboarding, and make internal knowledge easier to access.

Your job is to write a short, personalized cold email to a business prospect. The email should sound like it was written by a real person — not a marketing template. Keep it concise, warm, and direct.

Always respond with valid JSON only — no explanation, no markdown, no code blocks. Just the raw JSON object.`;

  const userPrompt = `Write a cold outreach email for the following prospect.

Prospect details:
- Business name: ${lead.business_name || "Unknown"}
- Website: ${lead.website_url || "Not provided"}
- Industry: ${lead.industry || "Not provided"}
- Location: ${lead.location || "Not provided"}
- Contact name: ${lead.contact_name || "there"}
- Notes: ${lead.notes || "None"}

AI analysis of this prospect:
- Business summary: ${analysis.business_summary || "Not available"}
- Likely pain points: ${Array.isArray(analysis.possible_pain_points) ? analysis.possible_pain_points.join(", ") : "Not available"}
- Recommended outreach angle: ${analysis.outreach_angle || "Not available"}
- Recommended offer: ${analysis.recommended_offer || "Not available"}

Rules:
- Keep the email under 150 words
- Sound human and conversational, not robotic or salesy
- Do not overpromise
- Mention one specific pain point using soft language like "Teams like yours often..." or "One area that may be worth exploring..."
- Mention Relativity Systems naturally in one sentence
- End with a simple CTA asking if they are open to a quick 15-minute conversation
- Avoid spam trigger words (guaranteed, free, urgent, limited time)
- Do not make up facts or use fake personalization like "I saw you are struggling with..."

Return a JSON object with exactly these fields:

{
  "subject": "A short, human-sounding email subject line (no clickbait)",
  "email_body": "The full email text, ready to copy-paste. Use plain text with line breaks.",
  "personalization_notes": "A short note for the BDR explaining what was personalized and why",
  "pain_point_used": "The specific pain point you chose to mention in the email",
  "cta": "The call to action used at the end of the email"
}`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildOutreachPrompt };
