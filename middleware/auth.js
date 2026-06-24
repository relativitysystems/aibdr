function requireApiKey(req, res, next) {
  const apiKey = process.env.AIBDR_INTERNAL_API_KEY;

  if (!apiKey) {
    console.error("ERROR: AIBDR_INTERNAL_API_KEY environment variable is not set.");
    return res.status(500).json({ success: false, error: "Server misconfiguration: API key not set." });
  }

  const provided = req.headers["x-api-key"];

  if (!provided || provided !== apiKey) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  next();
}

module.exports = requireApiKey;
