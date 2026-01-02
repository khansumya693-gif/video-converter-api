const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const VIDEO_DIR = path.join(__dirname, 'videos');

// ভিডিও folder তৈরি যদি না থাকে
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);

// API endpoint
app.get('/make-mp4', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  const filename = `yt_${Date.now()}.mp4`;
  const filepath = path.join(VIDEO_DIR, filename);

  // yt-dlp + ffmpeg command
  const cmd = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${filepath}" "${url}"`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).send("Download/Convert failed");
    }
    res.json({
      status: "ok",
      playback: `/videos/${filename}`,
      download: `/videos/${filename}`
    });
  });
});

// Serve videos folder
app.use('/videos', express.static(VIDEO_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
