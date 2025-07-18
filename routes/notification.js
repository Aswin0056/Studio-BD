// routes/notification.js
const express = require("express");
const pool = require("../db");
const router = express.Router();

// Get latest notification
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT message FROM notifications ORDER BY id DESC LIMIT 1');
    res.json({ message: result.rows[0]?.message || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

// Add or update notification
router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const existing = await pool.query('SELECT id FROM notifications LIMIT 1');

    if (existing.rows.length > 0) {
      // Update existing notification
      await pool.query('UPDATE notifications SET message = $1, created_at = NOW() WHERE id = $2', [message, existing.rows[0].id]);
    } else {
      // Insert new notification
      await pool.query('INSERT INTO notifications (message) VALUES ($1)', [message]);
    }

    res.json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
