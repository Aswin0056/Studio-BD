const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST - Save contact message
router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await pool.query(
      "INSERT INTO contact_messages (name, email, message, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
      [name, email, message]
    );
    res.status(200).json({ message: "Message received" });
  } catch (err) {
    console.error("🔥 Contact error:", err.message);
    res.status(500).json({ error: "Failed to save contact" });
  }
});

// GET - Fetch all contact messages
router.get("/contact-messages", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("🔥 Error fetching contact messages:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// DELETE - Optional: Delete a contact message by ID
router.delete("/contact-messages/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM contact_messages WHERE id = $1", [id]);
    res.status(200).json({ message: "Message deleted" });
  } catch (err) {
    console.error("🔥 Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

module.exports = router;
