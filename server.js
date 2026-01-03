import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

const VIDEO_DIR = "videos";
const MAP_FILE = "fileMap.json";

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
 * ১. র্যান্ডম স্টোরেজ রাউট (Masked Route)
 * এটি আপনার আসল API রাউটকে হাইড রাখবে। 
 * লিংকটি দেখতে অনেকটা এরকম হবে: /cdn/a7f2b9...
 */
app.get("/cdn/:token", (req, res) => {
  const token = req.params.token;
  
  // টোকেন থেকে ফাইল আইডি খুঁজে বের করা
  const fileId = Object.keys(fileMap).find(key => 
    crypto.createHash('md5').update(key).digest('hex') === token
  );

  const file = fileMap[fileId];

  if (!file || !fs.existsSync(file)) {
    return res.status(404).send("File not found or link expired.");
  }

  // ফাইলটি সরাসরি স্ট্রিম করা যাতে ব্রাউজার আসল সোর্স না বুঝে
  const stat = fs.statSync(file);
  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="video_${Date.now()}.mp4"`
  });

  fs.createReadStream(file).pipe(res);
});

// ২. মূল ফাংশন (লিংক জেনারেশন আপডেট করা হয়েছে)
app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  const filename = `${Date.now()}.mp4`;
  const filepath = path.join(VIDEO_DIR, filename);

  const cmd = `yt-dlp --cookies ./cookies.txt -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4 -o "${filepath}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
    if (err) return res.json({ status: "failed", message: stderr || err.message });

    // ১. একটি র্যান্ডম আইডি জেনারেট করা
    const id = crypto.randomBytes(8).toString("hex");
    fileMap[id] = filepath;
    saveMap();

    // ২. মাস্কড টোকেন তৈরি (ইউজার এটিই দেখবে)
    const maskedToken = crypto.createHash('md5').update(id).digest('hex');
    
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const secureUrl = `${baseUrl}/cdn/${maskedToken}`;

    res.json({
      status: "ok",
      playback: secureUrl,
      download: secureUrl
    });
  });
});

app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
