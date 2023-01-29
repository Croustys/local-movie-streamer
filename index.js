const express = require("express");
const app = express();
const fs = require("fs");
const path = require('path')

const PORT = process.env.PORT || 6363;

app.use('/browse', express.static(path.join(__dirname, 'public')))

app.get("/watch/*", function (req, res) {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
  }

  const path = req.params[0];
  const videoPath = `../../${path}`
  const videoSize = fs.statSync(videoPath).size;

  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(videoPath, { start, end });

  videoStream.pipe(res);
});

app.get("/id/*", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/next/*", (req, res) => {
  const paramsArr = req.params[0].split("/");
  const [current, extension] = paramsArr.pop().split(".");

  const path = paramsArr.join("/");
  const localPath = `../../${path}`
  const next = `${localPath}/${parseInt(current) + 1}.${extension}`;
  const prev = `${localPath}/${parseInt(current) - 1}.${extension}`;


  const result = {
    next: fs.existsSync(next) ? `${path}/${parseInt(current) + 1}.${extension}` : null,
    prev: fs.existsSync(prev) ? `${path}/${parseInt(current) - 1}.${extension}` : null
  }

  res.json(result);
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});
