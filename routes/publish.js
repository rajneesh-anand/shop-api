const express = require("express");
const { IncomingForm } = require("formidable");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const DatauriParser = require("datauri/parser");
const cloudinary = require("cloudinary").v2;

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

  try {
    if (Object.keys(data.files).length !== 0) {
      const photo = await fs.promises
        .readFile(data.files.image.path)
        .catch((err) => console.error("Failed to read file", err));

      let photo64 = parser.format(
        path.extname(data.files.image.name).toString(),
        photo
      );
      const uploadResult = await cloudinaryUpload(photo64.content);

      const result = await prisma.post.create({
        data: {
          title: data.fields.title,
          slug: data.fields.slug,
          content: data.fields.content,
          template: data.fields.template,
          category: data.fields.category,
          tags: JSON.parse(data.fields.tags),
          subCategories: JSON.parse(data.fields.subCategories),
          published: JSON.parse(data.fields.published),
          image: uploadResult.secure_url,
          author: { connect: { email: data.fields.author } },
        },
      });

      return res.status(200).json({
        msg: "success",
        data: result,
      });
    } else {
      const result = await prisma.post.create({
        data: {
          title: data.fields.title,
          slug: data.fields.slug,
          content: data.fields.content,
          template: data.fields.template,
          category: data.fields.category,
          tags: JSON.parse(data.fields.tags),
          subCategories: JSON.parse(data.fields.subCategories),
          published: JSON.parse(data.fields.published),
          author: { connect: { email: data.fields.author } },
        },
      });

      return res.status(200).json({
        msg: "success",
        data: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.get("/", async (req, res) => {
  const images = await CImage.getAll();
  return res.status(200).json({ msg: "success", result: images });
});

router.put("/:id/:status", async (req, res) => {
  try {
    const postId = req.params.id;
    const postStatus = JSON.parse(req.params.status);
    await prisma.post.update({
      where: { id: Number(postId) },
      data: { published: postStatus },
    });
    res.status(200).json({ msg: "success" });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

router.get("/draft/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await prisma.post.findFirst({
      where: { id: Number(postId) },
    });
    res.status(200).json({ msg: "success", result: post });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
});

module.exports = router;
