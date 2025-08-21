import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js"; // Adjust the path to your User model

dotenv.config();

// Database connection string (update this with your actual MongoDB URI)
const mongoUri = process.env.MONGO_URI;

console.log("mongoUri: ", mongoUri);

// Sample user data to seed
const userData = [
  {
    firstName: "Awais",
    lastName: "Onn",
    email: "avaisonn2@gmail.com",
    cnic: "35202-7601484-3",
    mobileNo: "+923354537279",
    organisationName: "Individual",
    dob: new Date("1994-11-26"),
    gender: "Male",
    password: "$2a$10$baBItW1WL/WT3nLdgB9ecepfAIhTTTWtUWD4mZzmzj8ir9YpSq9ki", // Makemein@123
    role: "User",
    isActive: true,
    cardNumber: 0,
  },
  {
    firstName: "Umer",
    lastName: "Khan",
    email: "mumerkhan@gmail.com",
    cnic: "54321-9876543-2",
    mobileNo: "+923324467035",
    organisationName: "",
    dob: new Date("1996-01-24"),
    gender: "Male",
    password: "$2a$10$baBItW1WL/WT3nLdgB9ecepfAIhTTTWtUWD4mZzmzj8ir9YpSq9ki", // Makemein@123
    role: "SuperAdmin",
    isActive: true,
  },
];

async function seedUsers() {
  try {
    // Connect to the MongoDB database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database");

    // Insert seed data
    await User.insertMany(userData);
    console.log("User data seeded successfully");

    // Disconnect from the database
    await mongoose.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

// Run the seed function
seedUsers();
