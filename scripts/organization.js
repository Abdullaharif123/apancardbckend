import mongoose from "mongoose";
import dotenv from "dotenv";
import Organisation from "../models/Organisation.js";

dotenv.config();

const updateOrganisations = async () => {
  try {
    await mongoose.connect("", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await Organisation.updateMany(
      { invoiceTemplate: { $exists: false } }, // Only update if missing
      {
        $set: {
          invoiceTemplate: {
            organizationName: "ApnaCard",
            address: "Lahore, Pakistan",
            phoneNumber: "+923354537279",
          },
        },
      }
    );

    console.log(`Updated ${result.modifiedCount} organizations.`);
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating organisations:", error);
    mongoose.connection.close();
  }
};

updateOrganisations();
