const OpenAI = require("openai");
const { buildWebsiteAnalysisPrompt } = require("../prompts/websiteAnalysisPrompt");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes a lead using AI and returns a structured analysis object.
 * @param {Object} lead - The lead row from Supabase
 * @returns {Object} Structured analysis JSON
 */
async function analyzeLeadWebsite(lead) {
  const { systemPrompt, userPrompt } = buildWebsiteAnalysisPrompt(lead);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;

  let analysis;
  try {
    analysis = JSON.parse(raw);
  } catch (err) {
    throw new Error("AI returned invalid JSON: " + raw);
  }

  return analysis;
}

module.exports = { analyzeLeadWebsite };
