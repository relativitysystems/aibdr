const express = require("express");
const supabase = require("../services/supabase");
const { scoreLead } = require("../services/scoringService");

const router = express.Router();

// POST /api/score/:leadId
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

    // Require analysis before scoring
    if (!lead.analysis) {
      return res.status(400).json({
        success: false,
        error: "This lead has not been analyzed yet. Run POST /api/analyze/:leadId first.",
      });
    }

    // Run AI scoring
    const scoreResult = await scoreLead(lead);

    // Merge scoring into existing analysis without touching other fields
    const updatedAnalysis = {
      ...lead.analysis,
      scoring: scoreResult,
    };

    // Keep status as "outreach_ready" if a draft already exists, otherwise set "scored"
    const newStatus = lead.outreach_draft ? "outreach_ready" : "scored";

    // Save score, updated analysis, status, and updated_at
    const { data: updatedLead, error: updateError } = await supabase
      .from("ai_bdr_leads")
      .update({
        score: scoreResult.score,
        analysis: updatedAnalysis,
        status: newStatus,
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
    console.error("Error scoring lead:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to score lead",
    });
  }
});

module.exports = router;
