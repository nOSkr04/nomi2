import Notification from "../models/Notification.js";
import MyError from "../utils/myError.js";
import asyncHandler from "express-async-handler";
import sendAllUserNotification from "../utils/sendAllUserNotification.js";
import User from "../models/User.js";
import paginate from "../utils/paginate.js";

export const getNotification = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const sort = req.query.sort;
  const select = req.query.select;

  const user = await User.findById(req.userId);
  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй.", 400);
  }

  const query = { users: user._id };

  [("select", "sort", "page", "limit")].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, Notification.find(query));

  const notifications = await Notification.find(query, select)
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  await Notification.updateMany(
    { users: user._id },
    { $set: { isRead: true } }
  );

  user.notificationCount = 0;
  user.save();

  res.status(200).json({
    success: true,
    data: notifications,
    count: notifications.length,
    pagination,
  });
});

export const createNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.create(req.body);
  res.status(200).json({
    success: true,
    data: notification,
  });
});

export const updateNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!notification) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.notificationId);
  if (!notification) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй.", 400);
  }

  notification.remove();

  res.status(200).json({
    success: true,
    data: notification,
  });
});

export const allUserNotification = asyncHandler(async (req, res, next) => {
  const users = await User.find().lean();
  const { data, body, title } = req.body;

  const uniqueIdsSet = new Set();

  const uniqueData = users.filter((item) => {
    const id = item.expoPushToken;
    if (!uniqueIdsSet.has(id)) {
      uniqueIdsSet.add(id);
      return true;
    }
    return false;
  });

  uniqueData.map(async (user) => {
    const { expoPushToken, _id } = user;
    if (expoPushToken) {
      await sendAllUserNotification(expoPushToken, data, title, body);
      await Notification.create({
        title,
        users: _id, // Link the notification to the user
      });
      await User.updateOne({ _id: _id }, { $inc: { notificationCount: 1 } });
    }
  });
  res.status(200).json({
    success: true,
    data: "success",
  });
});
