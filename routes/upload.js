const express = require("express");
const { IncomingForm } = require("formidable");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const DatauriParser = require("datauri/parser");
const cloudinary = require("cloudinary").v2;
const CImage = require("../db/images");

const router = express.Router();
const parser = new DatauriParser();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = (file) => cloudinary.uploader.upload(file);

router.post("/", async (req, res) => {
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  const photo = await fs.promises
    .readFile(data.files.image.path)
    .catch((err) => console.error("Failed to read file", err));

  let photo64 = parser.format(
    path.extname(data.files.image.name).toString(),
    photo
  );

  // Store Image to Database

  // try {
  //   await prisma.post.create({
  //     data: {
  //       title: "title",
  //       category: "category",
  //       slug: "slug",
  //       content: "content",
  //       tags: ["fetured", "new added"],
  //       image: photo64.content,
  //       // author: { connect: { email: session?.user?.email } },
  //     },
  //   });

  //   return res.status(200).json({
  //     msg: "success",
  //   });
  // } catch (error) {
  //   res.status(500).send(error);
  // } finally {
  //   async () => {
  //     await prisma.$disconnect();
  //   };
  // }

  // Upload Image to Cloudinary
  try {
    const uploadResult = await cloudinaryUpload(photo64.content);

    const cImage = new CImage({
      title: data.fields.title,
      excerpt: data.fields.excerpt,
      categories: JSON.parse(data.fields.categories),
      cloudinaryId: uploadResult.public_id,
      url: uploadResult.secure_url,
    });
    await cImage.save();

    return res.status(200).json({
      msg: "success",
      result: cImage,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/", async (req, res) => {
  // try {
  //   const posts = await prisma.post.findMany({
  //     select: {
  //       id: true,
  //       title: true,
  //       image: true,
  //     },
  //   });

  //   res.status(200).json({
  //     msg: "success",
  //     result: posts,
  //   });
  // } catch (error) {
  //   res.status(500).send(error);
  // } finally {
  //   async () => {
  //     await prisma.$disconnect();
  //   };
  // }

  const images = await CImage.getAll();
  return res.status(200).json({ msg: "success", result: images });
});

module.exports = router;
