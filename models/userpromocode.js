// models/userpromocode.js

import mongoose from "mongoose";

const userPromoCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    promoCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    billAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// 🔍 Index for faster queries (e.g., by user or promo code)
userPromoCodeSchema.index({ userId: 1 });
userPromoCodeSchema.index({ promoCode: 1, organisationId: 1 });
userPromoCodeSchema.index({ assignedAt: -1 });

const UserPromoCode = mongoose.model("UserPromoCode", userPromoCodeSchema);

export default UserPromoCode;