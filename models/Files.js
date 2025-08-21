import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  fileName: { type: String },
  filePath: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  isActive: { type: Boolean, default: false },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});

export default mongoose.model("Files", fileSchema);
