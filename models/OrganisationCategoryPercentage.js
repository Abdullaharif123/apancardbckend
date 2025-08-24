import mongoose from "mongoose";

const OrganisationCategoryPercentageSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
      unique: true, // ensures one document per organisation
    },
    categories: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        percentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model(
  "OrganisationCategoryPercentage",
  OrganisationCategoryPercentageSchema
);
