const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/", async (req, res) => {
  const boards = await pool.query("SELECT * FROM boards");
  res.json(boards.rows);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  const newBoard = await pool.query("INSERT INTO boards (name) VALUES ($1) RETURNING *", [name]);
  res.json(newBoard.rows[0]);
});

module.exports = router;
