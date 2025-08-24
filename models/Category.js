import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  categoryName: { type: String },
  imageUrl: { type: String },
  isGeneric: { type: Boolean, default: true },
  isActive: { type: Boolean, default: false },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});

export default mongoose.model("Category", categorySchema);
