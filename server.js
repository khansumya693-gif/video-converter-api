import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

const VIDEO_DIR = "videos";
const MAP_FILE = "fileMap.json";

// আপনার Vercel ডোমেইন লিংক
const VERCEL_DOMAIN = "https://next-update-tube-download-manager.vercel.app/download";

// Persistent Data Load করা
let fileMap = {};
if (fs.existsSync(MAP_FILE)) {
  try {
    fileMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));
  } catch (e) {
    fileMap = {};
  }
}

const saveMap = () => {
  fs.writeFileSync(MAP_FILE, JSON.stringify(fileMap, null, 2));
};

if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);

// Health check
app.get("/healthz", (req, res) => res.send("OK"));

/**
 * ১. এই রাউটটি Vercel ব্যাকগ্রাউন্ডে কল করবে।
 * এর ফলে আপনার আসল ডোমেইন হাইড থাকবে।
 */
app.get("/cdn/:token", (req, res) => {
  const token = req.params.token;
  
  // টোকেন থেকে অরিজিনাল ফাইল পাথ খুঁজে বের করা
  const id = Object.keys(fileMap).find(key => 
    crypto.createHash('md5').update(key).digest('hex') === token
  );

  const filePath = fileMap[id];
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  // ফাইলটি ডাউনলোড হিসেবে সার্ভ করা
  res.download(path.resolve(filePath), `video_${Date.now()}.mp4`);
});

/**
 * ২. মেইন মেক-এমপি৪ এন্ডপয়েন্ট
 */
app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  const filename = `${Date.now()}.mp4`;
  const out = path.join(VIDEO_DIR, filename);

  // আপনার দেওয়া yt-dlp কমান্ড
  const cmd = `yt-dlp --cookies ./cookies.txt --merge-output-format mp4 -f "bv*+ba/b" --js-runtimes node -o "${out}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ status: "failed", message: stderr || err.message });
    }

    // ১. একটি র্যান্ডম আইডি জেনারেট করা
    const id = crypto.randomBytes(6).toString("hex");
    fileMap[id] = out;
    saveMap(); 

    // ২. আইডি মাস্ক করে টোকেন তৈরি (MD5 Hash)
    const maskedToken = crypto.createHash('md5').update(id).digest('hex');

    // ৩. মাস্কড লিংক জেনারেট করা (যা ইউজার দেখবে)
    const secureUrl = `${VERCEL_DOMAIN}/${maskedToken}`;

    res.json({
      status: "ok",
      playback: secureUrl,
      download: secureUrl
    });
  });
});

// স্ট্যাটিক ফোল্ডার (প্রয়োজনে ব্যবহারের জন্য)
app.use("/videos", express.static("videos"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
