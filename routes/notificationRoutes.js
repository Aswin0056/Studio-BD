const express = require('express');
const router = express.Router();

// GET current notification
router.get('/', async (req, res) => {
  try {
    const { rows } = await req.db.query(
      'SELECT text, updated_at FROM app_notification WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.json({ text: '', updated_at: null });
    }
    res.json({
      text: rows[0].text,
      updated_at: rows[0].updated_at,
    });
  } catch (err) {
    console.error('GET /notification error:', err);
    res.status(500).json({ error: 'Failed to load notification' });
  }
});

// POST replace current notification
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Invalid text' });
  }
  try {
    const { rows } = await req.db.query(
      `INSERT INTO app_notification (id, text, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id)
       DO UPDATE SET text = EXCLUDED.text, updated_at = NOW()
       RETURNING text, updated_at`,
      [text.trim()]
    );
    res.json({
      message: 'Notification updated',
      text: rows[0].text,
      updated_at: rows[0].updated_at,
    });
  } catch (err) {
    console.error('POST /notification error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;
