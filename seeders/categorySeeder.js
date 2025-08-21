import dotenv from "dotenv";
import mongoose from "mongoose";
import Category from "../models/Category.js"; // Adjust the path to your Category model

dotenv.config();

// Database connection string
const mongoUri = process.env.MONGO_URI;

const categoriesData = [
  { categoryName: "Health", isActive: true },
  { categoryName: "Finance", isActive: true },
  { categoryName: "Technology", isActive: true },
  { categoryName: "Education", isActive: false },
  { categoryName: "Entertainment", isActive: true },
];

async function seedCategories() {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database");

    // Loop through the category data and insert if not exists
    for (const category of categoriesData) {
      const existingCategory = await Category.findOne({
        categoryName: category.categoryName,
      });

      if (!existingCategory) {
        const newCategory = new Category(category);
        await newCategory.save();
        console.log(`Category "${category.categoryName}" added successfully.`);
      } else {
        console.log(`Category "${category.categoryName}" already exists.`);
      }
    }

    // Disconnect from the database
    await mongoose.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
}

// Run the seed function
// seedCategories();
