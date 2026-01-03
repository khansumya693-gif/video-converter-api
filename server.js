import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const VIDEOS_DIR = path.join(process.cwd(), "videos");
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR);

app.use("/videos", express.static(VIDEOS_DIR));

let count = 0;

app.get("/convert", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  count++;

  const id = Date.now();
  const file = path.join(VIDEOS_DIR, `${id}.mp4`);

  const cmd = `yt-dlp --cookies ./cookies.txt --js-runtimes node -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -o "${file}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr || err.message });
    }

    res.json({
      status: "ok",
      playback: `/videos/${id}.mp4`,
      download: `/videos/${id}.mp4`,
      count
    });
  });
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
