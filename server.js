import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const VIDEOS_DIR = path.join(process.cwd(), "videos");
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR);

app.get("/healthz", (req, res) => res.send("OK"));

app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  const id = Date.now();
  const output = path.join(VIDEOS_DIR, `yt_${id}.mp4`);

  const cmd = `yt-dlp -f mp4 -o "${output}" "${url}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("yt-dlp error:", stderr);
      return res.status(500).json({
        status: "failed",
        message: stderr || err.message
      });
    }

    if (!fs.existsSync(output)) {
      return res.status(500).json({
        status: "failed",
        message: "Video file not created"
      });
    }

    res.json({
      status: "ok",
      playback: `/videos/${path.basename(output)}`,
      download: `/videos/${path.basename(output)}`
    });
  });
});

app.use("/videos", express.static(VIDEOS_DIR));

app.listen(PORT, () => console.log("Server running on", PORT));
