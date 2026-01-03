import express from "express";
import { exec } from "child_process";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/healthz", (req, res) => {
  res.send("OK");
});

app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  if (!fs.existsSync("videos")) fs.mkdirSync("videos");

  const out = `videos/${Date.now()}.mp4`;
  const cmd = `yt-dlp --cookies ./cookies.txt --merge-output-format mp4 -f "bv*+ba/b" --js-runtimes node -o "${out}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr || err.message });
    }
    res.json({
      status: "ok",
      playback: "/" + out,
      download: "/" + out
    });
  });
});

app.use("/videos", express.static("videos"));

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
