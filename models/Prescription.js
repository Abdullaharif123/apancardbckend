// models/PrescriptionV2.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const imageSchema = new Schema({
  name: { type: String, required: true },
  uploadedOn: { type: Date, default: Date.now },
  s3Url: { type: String, required: true },
});

const prescriptionSchema = new Schema(
  {
    addedBy: { type: String, required: true }, // Doctor's name
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Foreign key reference to Prescription
    cardNumber: { type: Number },
    specialRemarks: { type: String }, // Optional remarks
    specialInstructions: { type: String }, // Optional remarks
    imageUrls: [imageSchema], // Array of image objects
  },
  {
    timestamps: { createdAt: "createdOn", updatedAt: "updatedOn" }, // Adds createdOn and updatedOn
  }
);

export default model("Prescription", prescriptionSchema);
