import mongoose from "mongoose";

const organisationSchema = new mongoose.Schema({
  organisationName: { type: String, required: true },
  isActive: { type: Boolean, default: false },

  // ✅ Reverted: Store only category IDs
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],

  cardNumbers: { type: [Number], default: [] },
  invoiceTemplate: {
    organizationName: { type: String, default: "ApnaCard" },
    address: { type: String, default: "Lahore, Pakistan" },
    phoneNumber: { type: String, default: "+923354537279" },
  },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
});

export default mongoose.model("Organisation", organisationSchema);
