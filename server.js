import express from "express";
import { exec } from "child_process";
import fs from "fs";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = "map.json";
let map = {};
if (fs.existsSync(DB_FILE)) map = JSON.parse(fs.readFileSync(DB_FILE));

function saveMap() {
  fs.writeFileSync(DB_FILE, JSON.stringify(map, null, 2));
}

function makeId() {
  return crypto.randomBytes(4).toString("hex");
}

app.get("/healthz", (_, res) => res.send("OK"));

app.get("/make-mp4", (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ status: "failed", message: "Missing url" });

  if (!fs.existsSync("videos")) fs.mkdirSync("videos");

  const filename = `${Date.now()}.mp4`;
  const filepath = `videos/${filename}`;
  const id = makeId();

  const cmd = `yt-dlp --cookies ./cookies.txt --merge-output-format mp4 -f "bv*+ba/b" --js-runtimes node -o "${filepath}" "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
    if (err) return res.json({ status: "failed", message: stderr || err.message });

    map[id] = filepath;
    saveMap();

    res.json({
      status: "ok",
      id,
      playback: `/v/${id}`,
      download: `/d/${id}`
    });
  });
});

app.get("/v/:id", (req, res) => {
  const id = req.params.id;
  const file = map[id];
  if (!file || !fs.existsSync(file)) return res.status(404).send("Not found");

  res.sendFile(process.cwd() + "/" + file);
});

app.get("/d/:id", (req, res) => {
  const id = req.params.id;
  const file = map[id];
  if (!file || !fs.existsSync(file)) return res.status(404).send("Not found");

  res.download(process.cwd() + "/" + file);
});

app.listen(PORT, () => console.log("Server running on", PORT));
