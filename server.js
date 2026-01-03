import express from "express";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/healthz", (_, res) => res.send("OK"));

app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  // merged video+audio mp4 googlevideo link
  const cmd = `yt-dlp --cookies ./cookies.txt --js-runtimes node -g -f "b[ext=mp4]/b" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr || err.message });
    }

    const playbackUrl = stdout.trim().split("\n")[0];

    res.json({
      status: "ok",
      playback: playbackUrl,
      download: playbackUrl
    });
  });
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
