require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.AIBDR_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.AIBDR_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing AIBDR_SUPABASE_URL or AIBDR_SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = supabase;