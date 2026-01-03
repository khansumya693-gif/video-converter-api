const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const app = express();

app.get("/healthz", (_, res) => res.send("OK"));

app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  const out = `videos/${Date.now()}.mp4`;
  const cmd = `yt-dlp --cookies ./cookies.txt --merge-output-format mp4 -f "bv*+ba/b" --js-runtimes node -o "${out}" "${url}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr });
    }
    res.json({
      status: "ok",
      playback: "/" + out,
      download: "/" + out
    });
  });
});

app.use("/videos", express.static("videos"));

app.listen(3000, () => console.log("Server running"));
