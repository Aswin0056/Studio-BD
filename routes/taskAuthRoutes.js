const express = require('express');
const router = express.Router();
// const db = require('../db'); // PostgreSQL client (like pg or knex)
const pool = require('../db');

// ========== 1. ADMIN REGISTER ==========
router.post('/admin/task-register', async (req, res) => {
  const { name, email, companyEmail, password, role } = req.body;

  try {
    // 1. Insert into taskadmin
    const adminResult = await pool.query(
      `INSERT INTO taskadmin (name, admin_email, company_email, admin_password)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, companyEmail, password]
    );

    // 2. Insert companyEmail into taskcompany (ignore if already exists)
    await pool.query(
      `INSERT INTO taskcompany (company_email)
       VALUES ($1)
       ON CONFLICT (company_email) DO NOTHING`,
      [companyEmail]
    );

    res.status(201).json({ success: true, admin: adminResult.rows[0] });
  } catch (err) {
    console.error("Admin registration error:", err);
    res.status(500).json({ success: false, message: 'Admin registration failed' });
  }
});

// ========== 2. USER REGISTER ==========
router.post('/user/task-register', async (req, res) => {
  const { name, email, password, companyEmail, role } = req.body;

  try {
    // 1. Check if company exists
    const companyCheck = await pool.query(
      `SELECT * FROM taskcompany WHERE company_email = $1`,
      [companyEmail]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid company email. No such company registered." });
    }

    // 2. Insert into taskusers
    const userResult = await pool.query(
      `INSERT INTO taskusers (name, user_email, user_password, company_email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, password, companyEmail]
    );

    res.status(201).json({ success: true, user: userResult.rows[0] });
  } catch (err) {
    console.error("User registration error:", err);
    res.status(500).json({ success: false, message: 'User registration failed' });
  }
});

// ========== 3. LOGIN ==========
router.post('/auth/task-login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let result;

    if (["HR", "Owner"].includes(role)) {
      // Admin login
      result = await pool.query(
        `SELECT * FROM taskadmin WHERE admin_email = $1 AND admin_password = $2`,
        [email, password]
      );
    } else {
      // User login
      result = await pool.query(
        `SELECT * FROM taskusers WHERE user_email = $1 AND user_password = $2`,
        [email, password]
      );
    }

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

module.exports = router;
