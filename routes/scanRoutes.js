const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET - Fetch scan count
router.get("/scan-count", async (req, res) => {
  try {
    const result = await pool.query("SELECT count FROM scan_counter WHERE id = 1");
    res.status(200).json({ count: result.rows[0].count });
  } catch (err) {
    console.error("🔥 Error fetching scan count:", err.message);
    res.status(500).json({ error: "Failed to fetch scan count" });
  }
});

// POST - Increment scan count
router.post("/scan-count/increment", async (req, res) => {
  try {
    await pool.query("UPDATE scan_counter SET count = count + 1 WHERE id = 1");

    const updated = await pool.query("SELECT count FROM scan_counter WHERE id = 1");
    res.status(200).json({ count: updated.rows[0].count });

  } catch (err) {
    console.error("🔥 Error incrementing scan count:", err.message);
    res.status(500).json({ error: "Failed to update scan count" });
  }
});

module.exports = router;
