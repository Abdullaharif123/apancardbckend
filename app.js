import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import superAdminRoutes from "./routes/superAdmin/superAdminRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import userRoutes from "./routes/user/userRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";
import cors from "cors";

dotenv.config();
console.log("Loaded MONGODB_URI from env:", process.env.MONGO_URI);

const app = express();

// Middleware
app.use(express.json());

// ✅ Allow all origins
app.use(
  cors({
    origin: "*", // <-- allow all
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight OPTIONS globally
app.options("*", cors());

// Routes
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes); // 👀 matches login URL
app.use("/api", commonRoutes);
// MongoDB Connection
const environment = process.env.ENVIRONMENT || "dev";
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, { useNewUrlParser: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(
    `🚀 Server running on port ${PORT}, environment: ${process.env.ENVIRONMENT}`
  )
);
