const OpenAI = require("openai");
const { buildOutreachPrompt } = require("../prompts/outreachPrompt");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing from environment variables.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Cleans up common formatting issues in AI-generated email text.
 * Preserves intentional paragraph breaks (double newlines).
 */
function cleanEmailBody(text) {
  return (
    text
      // Normalize Windows line endings
      .replace(/\r\n/g, "\n")
      // Fix merged number+word like "quick15-minute" → "quick 15-minute"
      .replace(/([a-z])(\d)/g, "$1 $2")
      // Fix merged word+number like "message10" → "message 10"
      .replace(/(\d)([a-zA-Z])/g, "$1 $2")
      // Collapse runs of 3+ newlines down to 2 (one blank line between paragraphs)
      .replace(/\n{3,}/g, "\n\n")
      // Remove leading/trailing spaces on each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Final trim of the whole body
      .trim()
  );
}

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

  if (outreach.email_body) {
    outreach.email_body = cleanEmailBody(outreach.email_body);
  }

  return outreach;
}

module.exports = { generateOutreachDraft };
