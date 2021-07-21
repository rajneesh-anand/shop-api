const express = require("express");
const cors = require("cors");
const upload = require("./routes/upload");
const publish = require("./routes/publish");
const post = require("./routes/post");
const product = require("./routes/product");
const video = require("./routes/video");
const awsupload = require("./routes/awsupload");
require("dotenv").config();

const app = express();
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

var allowedDomains = ["https://vic.vercel.app", "http://localhost:3000"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedDomains.indexOf(origin) === -1) {
        var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use("/api/upload", upload);
app.use("/api/publish", publish);
app.use("/api/post", post);
app.use("/api/product", product);
app.use("/api/video", video);
app.use("/api/awsupload", awsupload);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
