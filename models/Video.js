import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
    },
    blurHash: String,
    duration: Number,
    image: String,
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export default mongoose.model("Video", VideoSchema);
