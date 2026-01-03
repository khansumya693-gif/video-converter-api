const express = require("express");
const ytdlp = require("yt-dlp-exec");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");

const app = express();
const VIDEO_DIR = path.join(__dirname, "videos");

// ভিডিও folder create
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);

// Health check route
app.get("/healthz", (req, res) => res.send("OK"));

// YouTube to MP4 endpoint
app.get("/make-mp4", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  const filename = `yt_${Date.now()}.mp4`;
  const filepath = path.join(VIDEO_DIR, filename);

  try {
    await ytdlp(url, {
      format: "bestvideo+bestaudio",
      merge_output_format: "mp4",
      output: filepath,
      ffmpeg_location: ffmpegPath
    });

    res.json({
      status: "ok",
      playback: `/videos/${filename}`,
      download: `/videos/${filename}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Download/Convert failed");
  }
});

// Serve videos folder
app.use("/videos", express.static(VIDEO_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
