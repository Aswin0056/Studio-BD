// backend/routes/contact.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // your pg connection

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    await pool.query(
      "INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)",
      [name, email, message]
    );

    res.status(200).json({ message: "Message saved successfully" });
  } catch (err) {
    console.error("Error saving contact message:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
