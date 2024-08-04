import path from "path";
import Advice from "../models/Advice.js";

import MyError from "../utils/myError.js";
import asyncHandler from "express-async-handler";
import paginate from "../utils/paginate.js";
import User from "../models/User.js";

// /advices
export const getAdvices = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const sort = req.query.sort;
  const select = req.query.select;

  [("select", "sort", "page", "limit")].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Advice);

  const advices = await Advice.find(req.query, select)
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit)
    .populate(["image", "video"]);

  res.status(200).json(advices);
});

export const getAdvice = asyncHandler(async (req, res, next) => {
  const advice = await Advice.findById(req.params.id).populate([
    "image",
    "video",
    "category",
  ]);

  if (!advice) {
    throw new MyError(req.params.id + " ID-тэй нийтлэл байхгүй байна.", 404);
  }

  advice.seen += 1;
  advice.save();

  res.status(200).json(advice);
});

export const createAdvice = asyncHandler(async (req, res, next) => {
  const advice = await Advice.create(req.body);

  res.status(200).json({
    success: true,
    data: advice,
  });
});

export const deleteAdvice = asyncHandler(async (req, res, next) => {
  const advice = await Advice.findById(req.params.id);

  if (!advice) {
    throw new MyError(req.params.id + " ID-тэй нийтлэл байхгүй байна.", 404);
  }

  if (req.userRole !== "admin") {
    throw new MyError("Та зөвхөн өөрийнхөө нийтлэлыг л засварлах эрхтэй", 403);
  }

  const user = await User.findById(req.userId);

  advice.remove();

  res.status(200).json({
    success: true,
    data: advice,
    whoDeleted: user.name,
  });
});

export const updateAdvice = asyncHandler(async (req, res, next) => {
  const advice = await Advice.findById(req.params.id);

  if (!advice) {
    throw new MyError(req.params.id + " ID-тэй нийтлэл байхгүйээээ.", 400);
  }

  if (advice.createUser.toString() !== req.userId && req.userRole !== "admin") {
    throw new MyError("Та зөвхөн өөрийнхөө нийтлэлыг л засварлах эрхтэй", 403);
  }

  req.body.updateUser = req.userId;

  for (let attr in req.body) {
    advice[attr] = req.body[attr];
  }

  advice.save();

  res.status(200).json({
    success: true,
    data: advice,
  });
});
