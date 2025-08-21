import mongoose from "mongoose";
import { cardTypes } from "../helper/enum.js";

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  profilePicture: { type: String, default: null },
  email: { type: String, unique: true },
  cnic: { type: String, unique: true },
  mobileNo: { type: String, unique: true },
  organisation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organisation",
    default: null,
  },

  organisationName: { type: String },
  facebookUrl: { type: String },
  instagramUrl: { type: String },
  linkedInUrl: { type: String },
  dob: { type: Date },
  relation: { type: String },
  gender: { type: String },
  password: { type: String },
  role: { type: String, default: "User" },
  isActive: { type: Boolean, default: false },
  cardNumber: { type: Number, unique: true },
  cardType: {
    type: String,
    enum: [cardTypes.singleCard, cardTypes.familyCard], // Updated values
    required: true,
  },
  parentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  familyMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});

userSchema.pre("save", function (next) {
  const isCardTypeChanged = this.isModified("cardType");
  const isFamilyChanged = this.isModified("familyMembers");

  if (
    (isCardTypeChanged || isFamilyChanged) &&
    this.cardType === cardTypes.singleCard &&
    this.familyMembers?.length > 0
  ) {
    return next(
      new Error("Family members can only be added if cardType is 'Family Card'")
    );
  }
  next();
});
userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

export default mongoose.model("User", userSchema);