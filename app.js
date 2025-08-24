import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import superAdminRoutes from "./routes/superAdmin/superAdminRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import userRoutes from "./routes/user/userRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";

dotenv.config();
console.log("Loaded MONGODB_URI from env:", process.env.MONGO_URI);

const app = express();

// ----------------------
// ✅ CORS CONFIG
// ----------------------
const allowedOrigins = [
  "http://localhost:3000",
  "https://apna-card.vercel.app",
  "https://apnacard.vercel.app", // ✅ added this
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Global preflight handler
app.all("*", (req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// ----------------------
// Middleware
// ----------------------
app.use(express.json());

// ----------------------
// Routes
// ----------------------
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api", commonRoutes);

// ----------------------
// MongoDB
// ----------------------
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}, environment: ${process.env.ENVIRONMENT}`)
);
