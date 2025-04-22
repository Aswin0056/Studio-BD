const express = require("express");
const router = express.Router();
const aiDb = require("../aiDB"); // This uses your AI DB

router.post("/", async (req, res) => {
  const { question, answer } = req.body;

  console.log("📥 Incoming Q&A:", { question, answer }); // Add this

  if (!question || !answer) {
    return res.status(400).json({ message: "Question and Answer required" });
  }

  try {
    await aiDb.query("INSERT INTO chat_pairs (question, answer) VALUES ($1, $2)", [question, answer]);
    res.status(201).json({ message: "Q&A saved to AI DB" });
  } catch (err) {
    console.error("AI DB error:", err.message);
    console.error(err.stack);
    res.status(500).json({ message: "Server error saving to AI DB" });
  }
});


module.exports = router;
