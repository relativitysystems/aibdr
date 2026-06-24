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

module.exports = router;