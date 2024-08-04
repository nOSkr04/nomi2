import User from "../models/User.js";
import MyError from "../utils/myError.js";
import asyncHandler from "express-async-handler";
import paginate from "../utils/paginate.js";
import sendEmail from "../utils/email.js";
import crypto from "crypto";
export const authMeUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new MyError(req.params.id, 401);
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});
export const userPrivacy = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    text: `
    <p>Үйлчилгээний нөхцөл</p>
    <ol>
    <li>Ерөнхий нөхцөл
    <ol>
    <li>s69.mn апп нь хэрэглэгчид Бэлгийн боловсрол олгох мэдээ мэдээлэл, зураг, контент, сургалт, зөвлөгөө өгөхтэй холбоотой үүсэх харилцааг зохицуулахад оршино.</li>
    <li>Энэхүү нөхцөл нь хэрэглэгч дээрх үйлчилгээг авахаас өмнө хүлээн зөвшөөрч баталгаажуулсны үндсэн дээр хэрэгжинэ.</li>
    <li>Хэрэглэгч 18 нас хүрсэн, эрх зүйн бүрэн чадамжтай байна.</li>
    <li>s69.mn апп дээрх мэдээ мэдээлэл, зураг, контент, сургалт, зөвлөгөөг ашиг олох зорилгоор хуулбарлаж олшруулах, дуурайх, өөр бусад ямар ч зүйлд ашиглахыг хориглоно.</li>
    </ol>
    </li>
    </ol>
    <ol start="2">
    <li>Хэрэглэгчийн бүртгэл
    <ol>
    <li>s69.mn апп-р үйлчлүүлэхдээ хэрэглэгч бүртгүүлсэн байна. Бүртгэлд нэвтрэх нэр, нэвтрэх нууц пин код үүсгэж илгээхийг заасан хүснэгтэд бөглөнө.</li>
    <li>Хэрэглэгчийн мэдээллийн нууцлалыг бид бүрэн хамгаална.</li>
    <li>Хэрэглэгчийн мэдээллийн үнэн зөв, бодит байдалд хэрэглэгч бүрэн хариуцлага хүлээнэ.</li>
    <li>Хэрэглэгч өөрийн үүсгэсэн нэвтрэх нэр болон нэвтрэх пин кодоо мартсан тохиолдолд бид хариуцлага хүлээхгүй.</li>
    </ol>
    </li>
    <li>Төлбөр тооцоо
    <ol>
    <li>Хэрэглэгчийн эрх нээлгэхэд нэг удаагийн төлбөр 20,000₮ /хорин мянган төгрөг/ байна.</li>
    <li>Төлбөр буцаагдахгүй.</li>
    <li>Төлбөрийг QPay шилжүүлгээр хийнэ.</li>
    </ol>
    </li>
    </ol>
    <ol start="4">
    <li>Бусад
    <ol>
    <li>Садар самуун явдалтай тэмцэх тухай хуульд заасан хязгаарлалтын хүрээнд олгох мэдээ мэдээлэл, зураг, контент, зөвлөгөөг танд хүргэх болно.</li>
    </ol>
    </li>
    </ol>
    <p>&nbsp;</p>`,
  });
});

// register
export const register = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  const token = user.getJsonWebToken();

  const cookieOption = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(200).cookie("s69-token", token, cookieOption).json({
    success: true,
    token,
    user: user,
  });
});

// логин хийнэ
export const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Оролтыгоо шалгана

  if (!username || !password) {
    throw new MyError("Нэвтрэх нэр болон нууц үйгээ дамжуулна уу", 400);
  }

  // Тухайн хэрэглэгчийн хайна
  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    throw new MyError("Бүртгэлгүй хэрэглэгч байна", 401);
  }

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError("Нэвтрэх нэр болон нууц үгээ зөв оруулна уу", 401);
  }

  const token = user.getJsonWebToken();

  const cookieOption = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(200).cookie("s69-token", token, cookieOption).json({
    success: true,
    token,
    user: user,
  });
});

export const onCompleteAllUser = asyncHandler(async (req, res) => {
  const result = await User.updateMany({}, { isComplete: true });
  if (!result) {
    throw new MyError("Амжилтгүй боллоо", 400);
  }
  res.status(200).json({
    success: true,
    result,
  });
});

export const logout = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.userId, {
    isAdult: false,
  });
  const cookieOption = {
    expires: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(200).cookie("s69-token", null, cookieOption).json({
    success: true,
    data: "logged out...",
  });
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, User);

  const users = await User.find(req.query, select)
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: users,
    pagination,
  });
});

export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй!", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  user.remove();

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const deleteMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  user.remove();
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const adultVerify = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  user.isAdult = true;
  user.save();
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.email) {
    throw new MyError(
      "Та нууц үг сэргээх Нэвтрэх нэр хаягаа дамжуулна уу",
      400
    );
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw new MyError(req.body.email + " имэйлтэй хэрэглэгч олдсонгүй!", 400);
  }

  const resetToken = user.generatePasswordChangeToken();
  await user.save();

  // await user.save({ validateBeforeSave: false });

  // Имэйл илгээнэ
  const link = `https://s69.mn/changepassword/${resetToken}`;

  const message = `Сайн байна уу<br><br>Та нууц үгээ солих хүсэлт илгээлээ.<br> Нууц үгээ доорхи линк дээр дарж солино уу:<br><br><a target="_blank" href="${link}">${link}</a><br><br>Өдрийг сайхан өнгөрүүлээрэй!`;

  const info = await sendEmail({
    email: user.email,
    subject: "Нууц үг өөрчлөх хүсэлт",
    message,
  });

  console.log("Message sent: %s", info.messageId);

  res.status(200).json({
    success: true,
    resetToken,
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.resetToken || !req.body.password) {
    throw new MyError("Та токен болон нууц үгээ дамжуулна уу", 400);
  }

  const encrypted = crypto
    .createHash("sha256")
    .update(req.body.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: encrypted,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new MyError("Токен хүчингүй байна!", 400);
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token,
    user: user,
  });
});
