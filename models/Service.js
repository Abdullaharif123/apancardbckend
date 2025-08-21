import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: false },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});

// Pre-save hook to update `updatedAt`
serviceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model
const Service = mongoose.model("Service", serviceSchema);
export default Service;
