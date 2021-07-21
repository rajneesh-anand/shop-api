const express = require("express");
const router = express.Router();
const videos = require("../util/mockData");
const fs = require("fs");
var path = require("path");

// get list of video
router.get("/", (req, res) => {
  res.status(200).json({ msg: "success", result: videos });
});

// make request for a particular video
router.get("/:id/data", (req, res) => {
  const data = videos.find((x) => x.slug === req.params.id);
  res.status(200).json({ msg: "success", result: data });
});

//streaming route
router.get("/:id", (req, res) => {
  const videoPath = `assets/${req.params.id}.mp4`;
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const videoRange = req.headers.range;
  if (videoRange) {
    const parts = videoRange.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// captions route

router.get("/:id/caption", (req, res) => {
  res.sendFile(path.join(__dirname, `../assets/captions/${req.params.id}.vtt`));
});

router.get("/:id/movie", (req, res) => {
  res.sendFile(path.join(__dirname, `../assets/${req.params.id}.mp4`));
});
module.exports = router;
