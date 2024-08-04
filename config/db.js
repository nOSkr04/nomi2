import mongoose from "mongoose";

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(
    `MongoDB холбогдлоо : ${conn.connection.host}`.cyan.underline.bold
  );
};

export default connectDB;
