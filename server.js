const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const VIDEO_DIR = path.join(__dirname, "videos");

// ভিডিও folder create যদি না থাকে
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);

// Health check route for Render
app.get("/healthz", (req, res) => res.send("OK"));

// YouTube to MP4 endpoint
app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  const filename = `yt_${Date.now()}.mp4`;
  const filepath = path.join(VIDEO_DIR, filename);

  // yt-dlp command using system pip-installed yt-dlp + ffmpeg
  const cmd = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${filepath}" "${url}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error("YT-DLP ERROR:", stderr || error.message);
      return res.status(500).send("Download/Convert failed");
    }

    // Success → Return playback + download links
    res.json({
      status: "ok",
      playback: `/videos/${filename}`,
      download: `/videos/${filename}`
    });
  });
});

// Serve videos folder statically
app.use("/videos", express.static(VIDEO_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
