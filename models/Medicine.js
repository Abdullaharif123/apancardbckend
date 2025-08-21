import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  medicineName: { type: String },
  isActive: { type: Boolean, default: false },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});

export default mongoose.model("Medicine", medicineSchema);
