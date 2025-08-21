import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const updateUsers = async () => {
  try {
    await mongoose.connect("", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await User.updateMany(
      { cardType: "FamilyCard" },
      { $set: { cardType: "Family Card" } }
    );

    console.log(`Updated ${result.modifiedCount} users.`);
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating users:", error);
    mongoose.connection.close();
  }
};

updateUsers();
