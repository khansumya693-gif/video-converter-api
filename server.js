import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

const VIDEO_DIR = "videos";
const MAP_FILE = "fileMap.json";

// Load persistent map or create new
let fileMap = {};
if (fs.existsSync(MAP_FILE)) {
  try {
    fileMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));
  } catch (e) {
    console.error("Error reading fileMap.json", e);
    fileMap = {};
  }
}

// Helper: save map to JSON file
const saveMap = () => {
  fs.writeFileSync(MAP_FILE, JSON.stringify(fileMap, null, 2));
};

// Ensure videos folder exists
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);

// Health check
app.get("/healthz", (req, res) => res.send("OK"));

// Serve short URL
app.get("/d/:id", (req, res) => {
  const id = req.params.id;
  const file = fileMap[id];
  if (!file || !fs.existsSync(file)) return res.status(404).send("Not found");
  res.sendFile(path.resolve(file));
});

// Make MP4 endpoint
app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  const filename = `${Date.now()}.mp4`;
  const filepath = path.join(VIDEO_DIR, filename);

  // yt-dlp + ffmpeg merge video + audio
  const cmd = `yt-dlp --cookies ./cookies.txt -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4 -o "${filepath}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
    if (err) return res.json({ status: "failed", message: stderr || err.message });

    // Generate persistent short ID
    const id = crypto.randomBytes(4).toString("hex");
    fileMap[id] = filepath;
    saveMap(); // Save to file

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const shortUrl = `${baseUrl}/d/${id}`;

    res.json({
      status: "ok",
      playback: shortUrl,
      download: shortUrl
    });
  });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
