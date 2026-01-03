import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// Convert video endpoint
app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  // Ensure videos folder exists
  if (!fs.existsSync("videos")) fs.mkdirSync("videos");

  const filename = `${Date.now()}.mp4`;
  const out = path.join("videos", filename);

  // yt-dlp + ffmpeg merge video + audio into single mp4
  const cmd = `yt-dlp --cookies ./cookies.txt -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4 -o "${out}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr || err.message });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/videos/${filename}`;

    res.json({
      status: "ok",
      playback: fileUrl,
      download: fileUrl
    });
  });
});

// Serve videos folder statically
app.use("/videos", express.static("videos"));

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
