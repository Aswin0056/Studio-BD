const express = require("express");
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool setup


router.post("/", async (req, res) => {
    const { name, email, message } = req.body;
    console.log("Incoming contact form data:", req.body);
  
    if (!name || !email || !message) {
      console.log("❌ Missing field!");
      return res.status(400).json({ error: "All fields are required" });
    }
  
    try {
      const result = await pool.query(
        "INSERT INTO contact_messages (name, email, message, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
        [name, email, message]
      );
  
      console.log("✅ Message saved:", result);
      res.status(200).json({ message: "Message received" });
    } catch (err) {
      console.error("🔥 Contact error:", err.message);
      res.status(500).json({ error: "Failed to save contact" });
    }
  });
  

module.exports = router;
