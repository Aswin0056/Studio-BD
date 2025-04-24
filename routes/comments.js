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

// Get comments route
router.get("/get-comments", async (req, res) => {
    try {
      // Query to retrieve all comments, ordered by latest first
      const result = await pool.query("SELECT * FROM comments ORDER BY created_at DESC LIMIT 20");
      
      // Send the comments as response
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching comments:", error);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }
  });
  

// Delete Comment
router.delete("/comments/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the comment exists
    const commentCheck = await pool.query("SELECT * FROM comments WHERE id = $1", [id]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Proceed with deletion
    await pool.query("DELETE FROM comments WHERE id = $1", [id]);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Failed to delete comment", error: err.message });
  }
});


  module.exports = router;
  
