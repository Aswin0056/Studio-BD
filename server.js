const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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


// In your server.js or routes file
const axios = require('axios');

const getStatus = async (link) => {
  if (!link.startsWith("http")) {
    link = "http://" + link; // Default to http if no scheme
  }
  try {
    const response = await axios.get(`${link}/status`, { timeout: 5000 });
    return response.data.status || "Online";
  } catch (error) {
    if (error.response) {
      return "Offline"; // server responded with a non-2xx status
    } else if (error.request) {
      return "Offline"; // no response from server
    } else {
      return "Unknown"; // some other error
    }
  }
};


app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects");

    // Fetch project status asynchronously
    const projectsWithStatus = await Promise.all(
      result.rows.map(async (project) => {
        const status = await getStatus(project.link);
        return { ...project, status };
      })
    );

    res.json({ projects: projectsWithStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch projects" });
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
