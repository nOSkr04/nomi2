import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import os from "os";
import asyncHandler from "../middleware/asyncHandle.js";
import Image from "../models/Image.js";
import { getVideoDuration, takeScreenshots } from "../utils/video.js";
import { setBlurHash } from "../utils/gm.js";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import MyError from "../utils/myError.js";
import Video from "../models/Video.js";
import imageSize from "image-size";

export const uploadVideo = asyncHandler(async (req, res) => {
  const file = req.files?.file;
  if (!file) {
    throw new MyError("File not found", 400);
  }
  const config = {
    region: process.env.region,
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    bucket: process.env.bucket,
    signatureVersion: "v4",
  };
  AWS.config.update(config);
  const s3 = new AWS.S3({
    apiVersion: "2006-03-01",
  });

  const imageId = uuidv4();

  const filetype = path.extname(file.name).replace(".", "") || "mp4";

  const filename = `${imageId}.${filetype}`;

  const outputPath = os.tmpdir();

  const filepath = path.join(outputPath, filename);

  await file.mv(filepath);

  const screenshots = await takeScreenshots(filepath);
  const blurHash = await setBlurHash(screenshots);
  const duration = await getVideoDuration(filepath);
  const imageSizeResult = imageSize(screenshots);

  const videoUploadParams = {
    Bucket: config.bucket,
    Key: filename,
    Body: fs.createReadStream(filepath),
  };

  const screenshotUploadParams = {
    Bucket: config.bucket,
    Key: `${imageId}.png`,
    Body: fs.createReadStream(screenshots),
  };
  const [videoUploadResult, screenshotUploadResult] = await Promise.all([
    s3.upload(videoUploadParams, {}).promise(),
    s3.upload(screenshotUploadParams, {}).promise(),
  ]);

  const image = await new Image({
    url: screenshotUploadResult.Location,
    blurhash: blurHash,
    width: imageSizeResult.width,
    height: imageSizeResult.height,
  }).save();

  const video = await new Video({
    url: videoUploadResult.Location,
    duration: duration,
    image: image._id,
  }).save();
  res.status(200).json({ video, image });
  // ffmpeg(filepath)
  //   .screenshots({
  //     count: 1,
  //     folder: outputPath,
  //     filename: screenshotFilename,
  //   })
  //   .on("end", async () => {
  //     const duration = await getVideoDuration(filepath);
  //     const videoUploadParams = {
  //       Bucket: config.bucket,
  //       Key: filename,
  //       Body: fs.createReadStream(filepath),
  //     };
  //     const screenshotUploadParams = {
  //       Bucket: config.bucket,
  //       Key: screenshotFilename,
  //       Body: fs.createReadStream(screenshotPath),
  //     };

  //     const [videoUploadResult, screenshotUploadResult] = await Promise.all([
  //       s3.upload(videoUploadParams, {}).promise(),
  //       s3.upload(screenshotUploadParams, {}).promise(),
  //     ]);

  //     const video = await new Video({
  //       url: videoUploadResult.Location,
  //       duration: duration,
  //       image: screenshotUploadResult.Location,
  //     }).save();

  //     res.status(200).json({ video });
  //   });
});
