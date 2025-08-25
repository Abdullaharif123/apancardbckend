import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import superAdminRoutes from "./routes/superAdmin/superAdminRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import userRoutes from "./routes/user/userRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();

// ✅ Allowed origins (explicit, no "*")
const allowedOrigins = [
  "https://apnacard.vercel.app",
  "http://localhost:3000",
];

// ✅ CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Manual fallback (Render sometimes strips headers)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Built-in middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 👇 Routes
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api", commonRoutes);

// Health check
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
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

// PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.ENVIRONMENT || "development"}`);
});

// Handle uncaught exceptions
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});
