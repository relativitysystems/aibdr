require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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