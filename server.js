import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Health check
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// Convert endpoint
app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  if (!fs.existsSync("videos")) fs.mkdirSync("videos");

  const filename = `${Date.now()}.mp4`;
  const out = path.join("videos", filename);

  const cmd = `yt-dlp --cookies ./cookies.txt --merge-output-format mp4 -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --js-runtimes node -o "${out}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr || err.message });
    }

    res.json({
      status: "ok",
      playback: `/videos/${filename}`,
      download: `/videos/${filename}`
    });
  });
});

// Static serve
app.use("/videos", express.static("videos"));

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
