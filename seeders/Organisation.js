import dotenv from "dotenv";
import mongoose from "mongoose";
import Organisation from "../models/Organisation.js";

dotenv.config();

// Database connection string (update this with your actual MongoDB URI)
const mongoUri = process.env.MONGO_URI;

// Function to seed the organization
const organizationSeeder = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database.");

    // Define the organization details
    const organization = {
      organisationName: "Individual", // Organization name
      isActive: true, // Set as active
      cardNumbers: [0], // Example card number
    };

    // Use upsert to insert or update this organization
    await Organisation.updateOne(
      { organisationName: organization.organisationName },
      {
        $set: { isActive: organization.isActive }, // Update `isActive`
        $addToSet: { cardNumbers: { $each: organization.cardNumbers } }, // Add new card number(s) without overwriting
      },
      { upsert: true }
    );

    console.log("Organization seeding with 'Individual' completed.");

    // Disconnect from the database
    mongoose.disconnect();
    console.log("Disconnected from the database.");
  } catch (error) {
    console.error("Error seeding organization:", error);
    mongoose.disconnect();
  }
};

// Run the seeder function
organizationSeeder();
