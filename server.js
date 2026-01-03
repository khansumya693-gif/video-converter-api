import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const VIDEOS_DIR = path.resolve("videos");
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR);

// ✅ Render health check
app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

// ✅ Convert + download endpoint
app.post("/convert", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.json({ status: "failed", message: "No URL provided" });

    const id = Date.now();
    const file = `${id}.mp4`;
    const output = path.join(VIDEOS_DIR, file);

    // 🔹 Best mp4 + audio merged
    const cmd = `yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" -o "${output}" "${url}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        return res.json({ status: "failed", message: stderr });
      }

      return res.json({
        status: "ok",
        playback: `/videos/${file}`,
        download: `/videos/${file}`,
      });
    });

  } catch (e) {
    console.error(e);
    res.json({ status: "failed", message: e.message });
  }
});

// ✅ Static video serving
app.use("/videos", express.static(VIDEOS_DIR));

// ✅ Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
