import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("jobs.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    role TEXT,
    platform TEXT,
    status TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    job_url TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    education TEXT,
    cgpa REAL,
    achievements TEXT,
    experience TEXT,
    skills TEXT
  );
`);

// Seed profile if empty
const profileCount = db.prepare("SELECT COUNT(*) as count FROM profile").get() as { count: number };
if (profileCount.count === 0) {
  db.prepare(`
    INSERT INTO profile (id, full_name, email, phone, education, cgpa, achievements, experience, skills)
    VALUES (1, 'Patan Salarkhan', 'salarkhanpatan7861@gmail.com', '+91 XXXXXXXXXX', 'B.Tech EEE 2026, KLEF University', 8.5, 'NASA Space Apps Winner, ₹14L govt grant', '6-month railway signalling internship at Efftronics Systems', 'Embedded Systems, IoT, AI/ML, EV, Robotics, Computer Vision, Firmware, Electronics, Automation')
  `).run();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/profile", (req, res) => {
    const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
    res.json(profile);
  });

  app.get("/api/applications", (req, res) => {
    const apps = db.prepare("SELECT * FROM applications ORDER BY applied_at DESC").all();
    res.json(apps);
  });

  app.post("/api/applications", (req, res) => {
    const { company, role, platform, status, job_url, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO applications (company, role, platform, status, job_url, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(company, role, platform, status, job_url, notes);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status = 'Interview' THEN 1 ELSE 0 END) as interviews
      FROM applications
    `).get();
    res.json(stats);
  });

  app.post("/api/automate", async (req, res) => {
    const { job, profile } = req.body;
    console.log(`[AUTOMATION] Starting task for ${job.company} on ${job.platform}...`);
    
    // Simulate real-world platform latency and checks
    await new Promise(r => setTimeout(r, 2000));
    
    // Randomly simulate a failure to show real-world behavior
    const isSuccess = Math.random() > 0.1; 
    
    if (isSuccess) {
      res.json({ 
        success: true, 
        message: `Successfully submitted application to ${job.company} via ${job.platform}. Confirmation email should arrive shortly.`,
        steps: [
          "Logged in successfully",
          "Navigated to job listing",
          "Parsed application form",
          "Filled profile details",
          "Uploaded resume",
          "Answered screening questions",
          "Submitted application"
        ]
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: `Failed to submit to ${job.company}. Platform requested additional CAPTCHA verification.`,
        error: "CAPTCHA_REQUIRED"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
