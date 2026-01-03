
import express from "express";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/healthz", (req, res) => {
  res.send("OK");
});

app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  // extract direct googlevideo mp4 url only (no download)
  const cmd = `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -g --cookies ./cookies.txt --js-runtimes node "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr || err.message });
    }

    const lines = stdout.trim().split("\n");

    const videoUrl = lines.find(l => l.includes("googlevideo.com"));
    if (!videoUrl) {
      return res.json({ status: "failed", message: "No googlevideo link found" });
    }

    res.json({
      status: "ok",
      playback: videoUrl.trim(),
      download: videoUrl.trim()
    });
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
