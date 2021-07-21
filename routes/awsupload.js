const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
var AWS = require("aws-sdk");
const prisma = require("../lib/prisma");
const { IncomingForm } = require("formidable");

const s3 = new AWS.S3({
  accessKeyId: process.env.IAM_USER_KEY,
  secretAccessKey: process.env.IAM_USER_SECRET,
  Bucket: process.env.BUCKET_NAME,
});

async function saveFilesToAWSBucket(fData) {
  var awsResponseAfterUpload = [];
  const photo = await fs.promises
    .readFile(fData.files.poster.path)
    .catch((err) => {
      console.error("Failed to read file", err);
    });

  const video = await fs.promises
    .readFile(fData.files.media.path)
    .catch((err) => {
      console.error("Failed to read file", err);
    });

  var params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fData.files.poster.name,
    ContentType: fData.files.poster.type,
    Body: photo,
    ACL: "public-read",
  };

  var paramsTwo = {
    Bucket: process.env.BUCKET_NAME,
    Key: fData.files.media.name,
    ContentType: fData.files.media.type,
    Body: video,
    ACL: "public-read",
  };
  try {
    let photoPromise = s3.upload(params).promise();
    let photoRes = await photoPromise;
    awsResponseAfterUpload.push(photoRes);

    let videoPromise = s3.upload(paramsTwo).promise();
    let resdata = await videoPromise;
    awsResponseAfterUpload.push(resdata);

    return awsResponseAfterUpload;
  } catch (error) {
    return error;
  }
}

router.post("/", async (req, res) => {
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  saveFilesToAWSBucket(data)
    .then(async (resData) => {
      if (resData.length != 2) {
        res.status(200).json({ msg: "Oops something went wrong" });
      } else {
        const result = await prisma.movie.create({
          data: {
            title: data.fields.title,
            slug: data.fields.slug,
            media: resData[1].Location,
            poster: resData[0].Location,
            categories: JSON.parse(data.fields.categories),
            time: data.fields.time,
            status: JSON.parse(data.fields.status),
            author: { connect: { email: data.fields.author } },
          },
        });

        res.status(200).json({ msg: "success", data: result });
      }
    })
    .catch((error) => {
      console.log(error);
      res.send({ error });
    });
});

module.exports = router;
