import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

const VIDEO_DIR = "videos";
const MAP_FILE = "fileMap.json";

// ১. আপনার Vercel ডোমেইন লিংক (এখানে আপনার তৈরি করা লিংকটি দেওয়া হয়েছে)
const VERCEL_DOMAIN = "https://next-update-tube-download-manager.vercel.app/download";

// Load persistent map or create new
let fileMap = {};
if (fs.existsSync(MAP_FILE)) {
  try {
    fileMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));
  } catch (e) {
    console.error("Error reading fileMap.json", e);
    fileMap = {};
  }
}

// Helper: save map to JSON file
const saveMap = () => {
  fs.writeFileSync(MAP_FILE, JSON.stringify(fileMap, null, 2));
};

// Ensure videos folder exists
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);

// Health check
app.get("/healthz", (req, res) => res.send("OK"));

/** * ২. ইন্টারনাল রাউট (Masked)
 * এটি আপনার আসল ফাইল সার্ভ করবে। 
 * Vercel ব্যাকগ্রাউন্ডে এই রাউট থেকেই ডাটা টেনে নিবে।
 */
app.get("/cdn/:token", (req, res) => {
  const token = req.params.token;
  
  // টোকেন থেকে অরিজিনাল ফাইল আইডি খুঁজে বের করা (MD5 Reverse matching)
  const id = Object.keys(fileMap).find(key => 
    crypto.createHash('md5').update(key).digest('hex') === token
  );

  const file = fileMap[id];
  if (!file || !fs.existsSync(file)) return res.status(404).send("File not found");

  // ফাইলটি সরাসরি ডাউনলোড বা প্লে করার জন্য পাঠানো
  res.download(path.resolve(file), `video_${Date.now()}.mp4`);
});

/**
 * ৩. Make MP4 endpoint
 * এখানে আমরা শর্ট ইউআরএল এর জায়গায় মাস্কড Vercel লিংক জেনারেট করছি।
 */
app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  const filename = `${Date.now()}.mp4`;
  const filepath = path.join(VIDEO_DIR, filename);

  // yt-dlp + ffmpeg merge video + audio
  const cmd = `yt-dlp --cookies ./cookies.txt -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4 -o "${filepath}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
    if (err) return res.json({ status: "failed", message: stderr || err.message });

    // ১. একটি র্যান্ডম আইডি তৈরি (Interal use only)
    const id = crypto.randomBytes(6).toString("hex");
    fileMap[id] = filepath;
    saveMap(); 

    // ২. আইডিকে মাস্ক করে টোকেন তৈরি করা (Publicly visible)
    const maskedToken = crypto.createHash('md5').update(id).digest('hex');

    // ৩. ফাইনাল মাস্কড লিংক তৈরি (Vercel ডোমেইন দিয়ে)
    const secureUrl = `${VERCEL_DOMAIN}/${maskedToken}`;

    res.json({
      status: "ok",
      playback: secureUrl,
      download: secureUrl
    });
  });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
