const express = require("express");
const supabase = require("../services/supabase");
const { generateOutreachDraft } = require("../services/outreachGenerator");

const router = express.Router();

// POST /api/outreach/:leadId
router.post("/:leadId", async (req, res) => {
  const { leadId } = req.params;

  try {
    // Fetch the lead from Supabase
    const { data: lead, error: fetchError } = await supabase
      .from("ai_bdr_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return res.status(404).json({
        success: false,
        error: "Lead not found",
      });
    }

    // Require analysis to exist before generating outreach
    if (!lead.analysis) {
      return res.status(400).json({
        success: false,
        error: "This lead has not been analyzed yet. Run POST /api/analyze/:leadId first.",
      });
    }

    // Generate the outreach draft
    const outreach = await generateOutreachDraft(lead);

    // Merge outreach into the existing analysis object without overwriting other fields
    const updatedAnalysis = {
      ...lead.analysis,
      outreach,
    };

    // Save outreach_draft, updated analysis, status, and updated_at
    const { data: updatedLead, error: updateError } = await supabase
      .from("ai_bdr_leads")
      .update({
        outreach_draft: outreach.email_body,
        analysis: updatedAnalysis,
        status: "outreach_ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error generating outreach draft:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate outreach draft",
    });
  }
});

module.exports = router;
