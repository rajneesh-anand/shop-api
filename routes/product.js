const express = require("express");
const { IncomingForm } = require("formidable");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");
const DatauriParser = require("datauri/parser");
const cloudinary = require("cloudinary").v2;
const router = express.Router();
const parser = new DatauriParser();

var AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.IAM_USER_KEY,
  secretAccessKey: process.env.IAM_USER_SECRET,
  Bucket: process.env.BUCKET_NAME,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = (file) => cloudinary.uploader.upload(file);

var awsImagePath = [];

const readFile = async (file) => {
  const photo = await fs.promises.readFile(file.path).catch((err) => {
    console.error("Failed to read file", err);
  });
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: file.name,
    ContentType: file.type,
    Body: photo,
    ACL: "public-read",
  };

  try {
    let uploadRes = s3.upload(params).promise();
    let resData = await uploadRes;
    awsImagePath.push(resData.Location);
  } catch (error) {
    return error;
  }
};

const uploadPhototToawsS3 = async (data) => {
  const images = data.files.images;
  const promises = images.map((item) => readFile(item));
  await Promise.all(promises);
  return { message: "success" };
};

router.post("/", async (req, res) => {
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.multiples = true;
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  uploadPhototToawsS3(data)
    .then(async (pres) => {
      if (pres.message === "success") {
        try {
          const result = await prisma.product.create({
            data: {
              name: data.fields.product_name,
              slug: data.fields.slug,
              price: Number(data.fields.mrp),
              sellingPrice: Number(data.fields.selling_price),
              discount: Number(data.fields.discount),
              gst: Number(data.fields.gst),
              description: data.fields.description,
              images: awsImagePath,
              category: data.fields.category,
              subCategories: JSON.parse(data.fields.sub_category),
              size: data.fields.size,
              weight: Number(data.fields.weight),
              minimumQuantity: Number(data.fields.minimum_quantity),
              usage: data.fields.usage,
              inStock: JSON.parse(data.fields.stock),
            },
          });

          return res.status(200).json({
            msg: "success",
            data: result,
          });
        } catch (error) {
          console.log(error);
          return res.status(500).send(error);
        } finally {
          async () => {
            await prisma.$disconnect();
          };
        }
      }
    })
    .catch((error) => console.log(error));
});

router.post("/:id", async (req, res) => {
  const productId = req.params.id;
  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
  console.log(data);

  if (Object.keys(data.files).length !== 0) {
    uploadPhototToawsS3(data)
      .then(async (pres) => {
        if (pres.message === "success") {
          try {
            const result = await prisma.product.update({
              where: { id: Number(productId) },
              data: {
                name: data.fields.product_name,
                slug: data.fields.slug,
                price: Number(data.fields.mrp),
                sellingPrice: Number(data.fields.selling_price),
                discount: Number(data.fields.discount),
                gst: Number(data.fields.gst),
                description: data.fields.description,
                images: awsImagePath,
                category: data.fields.category,
                subCategories: JSON.parse(data.fields.sub_category),
                size: data.fields.size,
                weight: Number(data.fields.weight),
                minimumQuantity: Number(data.fields.minimum_quantity),
                usage: data.fields.usage,
                inStock: JSON.parse(data.fields.stock),
              },
            });

            return res.status(200).json({
              msg: "success",
              data: result,
            });
          } catch (error) {
            console.log(error);
            return res.status(500).send(error);
          } finally {
            async () => {
              await prisma.$disconnect();
            };
          }
        }
      })
      .catch((error) => console.log(error));
  } else {
    try {
      const result = await prisma.product.update({
        where: { id: Number(productId) },
        data: {
          name: data.fields.product_name,
          slug: data.fields.slug,
          price: Number(data.fields.mrp),
          sellingPrice: Number(data.fields.selling_price),
          discount: Number(data.fields.discount),
          gst: Number(data.fields.gst),
          description: data.fields.description,
          category: data.fields.category,
          subCategories: JSON.parse(data.fields.sub_category),
          size: data.fields.size,
          weight: Number(data.fields.weight),
          minimumQuantity: Number(data.fields.minimum_quantity),
          usage: data.fields.usage,
          inStock: JSON.parse(data.fields.stock),
        },
      });
      return res.status(200).json({
        msg: "success",
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    } finally {
      async () => {
        await prisma.$disconnect();
      };
    }
  }
});

module.exports = router;
