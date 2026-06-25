const express = require("express");
const supabase = require("../services/supabase");
const { scrapeWebsite } = require("../services/websiteScraper");

const router = express.Router();

// Statuses that indicate the lead is already in progress — don't downgrade them
const KEEP_STATUS = new Set([
  "outreach_ready",
  "contacted",
  "replied",
  "booked_call",
  "closed_won",
  "closed_lost",
]);

// POST /api/scrape/:leadId
router.post("/:leadId", async (req, res) => {
  const { leadId } = req.params;

  try {
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

    if (!lead.website_url) {
      return res.status(400).json({
        success: false,
        error: "This lead does not have a website_url. Add one before scraping.",
      });
    }

    const scrapeResult = await scrapeWebsite(lead.website_url);

    const newStatus = KEEP_STATUS.has(lead.status) ? lead.status : "scraped";

    const { data: updatedLead, error: updateError } = await supabase
      .from("ai_bdr_leads")
      .update({
        website_scrape: scrapeResult,
        website_text: scrapeResult.combined_text,
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
    console.error("Error scraping website:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to scrape website",
    });
  }
});

module.exports = router;
