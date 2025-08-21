import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export const getRoleFromToken = (token) => {
  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return the role from the decoded payload
    return decoded.role;
  } catch (err) {
    // Handle token verification errors
    console.error("Invalid or expired token:", err);
    return null;
  }
};

export const getUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // Verify the token and decode the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return the role from the decoded payload
    return decoded.userId;
  } catch (err) {
    // Handle token verification errors
    console.error("Invalid or expired token:", err);
    return null;
  }
};
