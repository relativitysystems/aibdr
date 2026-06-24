const OpenAI = require("openai");
const { buildOutreachPrompt } = require("../prompts/outreachPrompt");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing from environment variables.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a cold outreach email draft for a lead.
 * @param {Object} lead - The full lead row from Supabase (must include analysis)
 * @returns {Object} Structured outreach JSON with subject, email_body, etc.
 */
async function generateOutreachDraft(lead) {
  const { systemPrompt, userPrompt } = buildOutreachPrompt(lead);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;

  let outreach;
  try {
    outreach = JSON.parse(raw);
  } catch (err) {
    throw new Error("AI returned invalid JSON: " + raw);
  }

  return outreach;
}

module.exports = { generateOutreachDraft };
