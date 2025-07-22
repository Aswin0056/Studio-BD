const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// In your server.js or routes file
const axios = require('axios');
const router = express.Router();
const path = require("path");
const nodemailer = require('nodemailer');
const boardRoutes = require("./routes/boards");
const ytdl = require("ytdl-core");


dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'azhstudio057@gmail.com',
    pass: 'suwa hbac gtnp hyuy' 
  }
});

app.post('/api/contact', async (req, res) => {
  const { email, message } = req.body;

const mailOptions = {
  from: '"Azh Studio" <azhstudio057@gmail.com>',
  to: email,
  subject: 'Welcome to Azh Studio',
  text: `Thanks for contacting Azh Studio!\n\nYour Message:\n${message}\n\n- Team Azh Studio`,
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to Azh Studio</h2>
      <p>Thanks for reaching out to us!</p>
      <p><strong>Your Message:</strong></p>
      <blockquote>${message}</blockquote>
      <p>– Team Azh Studio</p>
    </div>
  `,
  headers: {
    'X-Priority': '3',
    'X-Mailer': 'NodeMailer'
  }
};

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    console.error('SendMail error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

// POST /notification-text

const notificationRoutes = require('./routes/notification');
app.use('/api/notification', notificationRoutes);





// let latestNotification = { text: '', timestamp: 0 };

// app.post('/notification-text', (req, res) => {
//   const { text, timestamp } = req.body;
//   if (text && timestamp) {
//     latestNotification = { text, timestamp };
//     return res.status(200).json({ message: 'Notification updated' });
//   } else {
//     return res.status(400).json({ error: 'Missing text or timestamp' });
//   }
// });

// // GET /notification-text
// app.get('/notification-text', (req, res) => {
//   res.json(latestNotification);
// });


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

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);


router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Auth Route Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Assuming you're using Express for your backend

// Fetch reminder for a specific user
// Express backend code


// Save or update reminder for a specific user
// ✅ KEEP THIS ONE ONLY
app.post("/api/reminder", async (req, res) => {
  const { text } = req.body;
  const userId = 1;

  if (!text) return res.status(400).json({ message: "Reminder text is required" });

  try {
    const result = await pool.query(
      `INSERT INTO reminders (user_id, reminder_text)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET reminder_text = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, text]
    );

    res.json({ reminder: result.rows[0] });
  } catch (err) {
    console.error("🔥 Reminder error:", err.message, err.stack);
    res.status(500).json({ message: "Failed to add reminder" });
  }
});

app.get("/api/reminder", async (req, res) => {
  const userId = 1; // hardcoded for now

  try {
    const result = await pool.query("SELECT * FROM reminders WHERE user_id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.json({ reminder: { reminder_text: "" } }); // no reminder saved yet
    }

    res.json({ reminder: result.rows[0] });
  } catch (err) {
    console.error("Error fetching reminder:", err.message);
    res.status(500).json({ message: "Failed to fetch reminder" });
  }
});



// Fetch Projects
app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects");

    // Convert snake_case to camelCase
    const camelCaseProjects = result.rows.map(project => ({
      ...project,
      imageUrl: project.image_url,
      commandsUsed: project.commands_used,
      userCount: project.user_count,
    }));

    res.json({ projects: camelCaseProjects });
  } catch (err) {
    console.error("Error fetching projects", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});


// Add New Project
app.post("/api/projects", async (req, res) => {
  try {
    const {
      name,
      imageUrl, // camelCase from frontend
      link,
      status,
      commandsUsed,
      userCount
    } = req.body;

    const result = await pool.query(
      "INSERT INTO projects (name, image_url, link, status, commands_used, user_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, imageUrl, link, status, commandsUsed, userCount] // use camelCase variables
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Error inserting project:", err.message);
    console.error("🧠 Stack Trace:", err.stack);
    res.status(500).json({ message: "Server error" });
  }
});


// Delete Project
app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await ProjectModel.findByIdAndDelete(id); // or your DB logic
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Serve APK files from /downloads folder
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

app.get("/", (req, res) => {
  res.send("Backend is running.");
});


const rateLimit = require("express-rate-limit");

// Apply rate limiting to your routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter); // Apply to all routes

const aiDataRoutes = require("./routes/aiDataRoutes");
app.use("/api/aiData", aiDataRoutes); // ✅ this should be present

const commentRoutes = require('./routes/comments');
app.use('/api', commentRoutes);

const contactRoutes = require('./routes/contact');
app.use('/api', contactRoutes);

router.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

app.get("/", (req, res) => {
  res.send("Azh Studio Backend is alive! 🚀");
});

router.get("/", (req, res) => {
  res.send("Azh Studio API is running! ✅");
});

app.get("/ping", (req, res) => {
  res.status(200).json({ status: "Online", message: "Backend is running ✅" });
});

// Endpoint to fetch user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    // Simulate user ID (this should come from authentication like JWT)
    const userId = 1; // Replace this with actual user authentication

    // Fetch user profile from the database
    const result = await pool.query('SELECT name, bio, image FROM users WHERE id = $1', [userId]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return res.json(user);
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ error: 'Failed to load profile data. Please try again later.' });
  }
});



app.get("/api/youtube", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ success: false, message: "URL missing" });
  }

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ success: false, message: "Invalid YouTube URL" });
  }

  try {
    console.log("🔗 Fetching info for:", videoUrl);

    const info = await ytdl.getInfo(videoUrl);
    const baseUrl = "https://studio-bd-zymf.onrender.com";
    const encodedUrl = encodeURIComponent(videoUrl);

    res.json({
      success: true,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.at(-1)?.url,
      duration: `${info.videoDetails.lengthSeconds} seconds`,
      channel: info.videoDetails.author?.name,
      views: info.videoDetails.viewCount,
      uploaded: info.videoDetails.publishDate,
      videoUrl: `${baseUrl}/api/download/video?url=${encodedUrl}`,
      audioUrl: `${baseUrl}/api/download/audio?url=${encodedUrl}`
    });
  } catch (err) {
    console.error("❌ YouTube fetch error:", err.message);
    console.error(err.stack); // full stack trace
    res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
});


// ⬇️ Video download route (MP4)
app.get("/api/download/video", (req, res) => {
  const url = req.query.url;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send("Invalid URL");
  }

  res.header("Content-Disposition", 'attachment; filename="video.mp4"');
  ytdl(url, {
    quality: "highestvideo",
    filter: "videoandaudio"
  }).pipe(res);
});

// 🎵 Audio download route (MP3)
app.get("/api/download/audio", (req, res) => {
  const url = req.query.url;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send("Invalid URL");
  }

  res.header("Content-Disposition", 'attachment; filename="audio.mp3"');
  ytdl(url, {
    quality: "highestaudio",
    filter: "audioonly"
  }).pipe(res);
});


// SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Connected to Supabase DB 🚀");
});
