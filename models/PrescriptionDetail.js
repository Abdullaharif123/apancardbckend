// models/PrescriptionDetail.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const prescriptionDetailSchema = new Schema(
  {
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
    }, // Foreign key reference to Prescription
    tabletName: { type: String, required: true }, // Name of the tablet
    days: { type: Number, min: 1, default: 1, required: true },
    isMorning: { type: Number, min: 0, default: 0, required: true }, // Number of tablets in the morning
    isEvening: { type: Number, min: 0, default: 0, required: true }, // Number of tablets in the evening
    isNight: { type: Number, min: 0, default: 0, required: true }, // Number of tablets at night
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export default model("prescriptionDetail", prescriptionDetailSchema);
