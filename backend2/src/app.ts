import express from "express";
import multer from "multer";
import analyzeRouter from "./routes/analyze";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Ensure tmp uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up Multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, file.originalname),
// });
// const upload = multer({ storage });

// Mount routes
app.use("/analyze", analyzeRouter);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});
