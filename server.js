const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// In your server.js or routes file
const axios = require('axios');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// LOGIN ROUTE
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// REGISTER ROUTE
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ message: "User registered", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




const getStatus = async (link) => {
  if (!link.startsWith("http://") && !link.startsWith("https://")) {
    link = "http://" + link; // Default to http if no scheme is present
  }

  try {
    const response = await axios.get(`${link}/status`, { timeout: 5000 });
    return response.data.status || "Online";
  } catch (error) {
    if (error.response) {
      // Server responded with a non-2xx status code
      return `Offline (Status: ${error.response.status})`; // You can include status for more context
    } else if (error.request) {
      // No response received
      return "Offline (No response from server)";
    } else {
      // Some other error occurred (e.g., bad URL, etc.)
      return `Unknown error: ${error.message}`;
    }
  }
};


// Fetch Projects
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects");
    res.json({ projects: result.rows });
  } catch (err) {
    console.error("Error fetching projects", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// Add New Project
app.post("/api/projects", async (req, res) => {
  const { name, imageUrl, link, status, commandsUsed, userCount } = req.body;
  
  try {
    const result = await pool.query(
      "INSERT INTO projects (name, image_url, link, status, commands_used, user_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, imageUrl, link, status, commandsUsed, userCount]
    );

    const newProject = result.rows[0];
    res.status(201).json(newProject);
  } catch (err) {
    console.error("Error adding project:", err);
    res.status(500).json({ message: "Failed to add project" });
  }
});

// Delete Project
app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM projects WHERE id = $1", [id]);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
});


const rateLimit = require("express-rate-limit");

// Apply rate limiting to your routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter); // Apply to all routes



// SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Connected to Supabase DB 🚀");
});
