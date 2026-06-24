const express = require("express");
const supabase = require("../services/supabase");

const router = express.Router();

// GET /api/leads
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ai_bdr_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      leads: data,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch leads",
    });
  }
});

// POST /api/leads
router.post("/", async (req, res) => {
  try {
    const {
      business_name,
      website_url,
      industry,
      location,
      contact_name,
      contact_email,
      contact_phone,
      source,
      notes,
    } = req.body;

    if (!business_name) {
      return res.status(400).json({
        success: false,
        error: "business_name is required",
      });
    }

    const { data, error } = await supabase
      .from("ai_bdr_leads")
      .insert([
        {
          business_name,
          website_url,
          industry,
          location,
          contact_name,
          contact_email,
          contact_phone,
          source: source || "manual",
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      lead: data,
    });
  } catch (error) {
    console.error("Error creating lead:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create lead",
    });
  }
});

// GET /api/leads/:leadId
router.get("/:leadId", async (req, res) => {
  const { leadId } = req.params;

  try {
    const { data: lead, error } = await supabase
      .from("ai_bdr_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return res.status(404).json({
        success: false,
        error: "Lead not found",
      });
    }

    res.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error("Error fetching lead:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch lead",
    });
  }
});

const ALLOWED_STATUSES = [
  "new",
  "analyzed",
  "scored",
  "outreach_ready",
  "contacted",
  "follow_up_needed",
  "replied",
  "booked_call",
  "closed_won",
  "closed_lost",
  "bad_fit",
];

// PATCH /api/leads/:leadId/status
router.patch("/:leadId/status", async (req, res) => {
  const { leadId } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: "status is required",
    });
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
    });
  }

  try {
    // Check the lead exists
    const { data: existing, error: fetchError } = await supabase
      .from("ai_bdr_leads")
      .select("id")
      .eq("id", leadId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: "Lead not found",
      });
    }

    // Build the update object — only include notes if it was provided
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from("ai_bdr_leads")
      .update(updates)
      .eq("id", leadId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error updating lead status:", error);

    res.status(500).json({
      success: false,
      error: "Failed to update lead status",
    });
  }
});

module.exports = router;