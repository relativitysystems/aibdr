const express = require("express");
const supabase = require("../services/supabase");
const { analyzeLeadWebsite } = require("../services/websiteAnalyzer");

const router = express.Router();

// POST /api/analyze/:leadId
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

    // Run AI analysis
    const analysis = await analyzeLeadWebsite(lead);

    // Save analysis back to the lead row
    const { data: updatedLead, error: updateError } = await supabase
      .from("ai_bdr_leads")
      .update({
        analysis,
        status: "analyzed",
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
    console.error("Error analyzing lead:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze lead",
    });
  }
});

module.exports = router;
