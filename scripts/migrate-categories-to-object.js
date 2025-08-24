// scripts/clear-organisation-categories.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Organisation from "../models/Organisation.js";

const DB_URI = process.env.MONGO_URI_DEV;

async function clearCategories() {
  try {
    await mongoose.connect(DB_URI);
    const result = await Organisation.updateMany({}, { $unset: { categories: "" } });
    console.log(`✅ Cleared categories from ${result.modifiedCount} organisations`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error clearing categories:", err.message);
    process.exit(1);
  }
}

clearCategories();
