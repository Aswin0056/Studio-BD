const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool setup

router.post('/add-comment', async (req, res) => {
  const { name, gmail, comment } = req.body;
  try {
    await pool.query(
      'INSERT INTO comments (name, gmail, comment, created_at) VALUES ($1, $2, $3, NOW())',
      [name, gmail, comment]
    );
    res.status(200).json({ message: 'Comment added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
