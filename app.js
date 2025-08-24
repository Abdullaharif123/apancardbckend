import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import superAdminRoutes from "./routes/superAdmin/superAdminRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import userRoutes from "./routes/user/userRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";
import cors from "cors";
//test
// Load environment variables
dotenv.config();

console.log("Loaded MONGODB_URI from env:", process.env.MONGO_URI);

const app = express();

// Define allowed origins
const corsOptions = {
  origin: [
    "https://apnacard.vercel.app"  // ✅ Add your current frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Added OPTIONS
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  exposedHeaders: ["Content-Length"],
};

// Built-in middleware
app.use(express.json({ limit: "10mb" })); // Handle large payloads if needed
app.use(express.urlencoded({ extended: true }));

// 👇 Routes
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api", commonRoutes);

// 👉 Optional: Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI is not defined in environment variables!");
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Remove deprecated options if not needed
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// Handle unhandled promise rejections
mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

// PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.ENVIRONMENT || "development"}`);
});

// Optional: Handle uncaught exceptions
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  // server.close(() => process.exit(1));
});
