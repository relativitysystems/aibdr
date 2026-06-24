require("dotenv").config();

const express = require("express");
const cors = require("cors");

const leadsRouter = require("./routes/leads");
const analyzeRouter = require("./routes/analyze");
const outreachRouter = require("./routes/outreach");
const scoreRouter = require("./routes/score");
const requireApiKey = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/leads", requireApiKey, leadsRouter);
app.use("/api/analyze", requireApiKey, analyzeRouter);
app.use("/api/outreach", requireApiKey, outreachRouter);
app.use("/api/score", requireApiKey, scoreRouter);

app.get("/", (req, res) => {
  res.json({
    message: "ai_bdr backend is running",
    status: "ok",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "ai_bdr",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ai_bdr server running on port ${PORT}`);
});