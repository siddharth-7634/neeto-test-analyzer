"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyze_1 = __importDefault(require("./routes/analyze"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware to parse JSON bodies
app.use(express_1.default.json());
// Ensure tmp uploads folder exists
const uploadDir = path_1.default.join(__dirname, "..", "uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
// Set up Multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, file.originalname),
// });
// const upload = multer({ storage });
// Mount routes
app.use("/analyze", analyze_1.default);
// Start server
app.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
});
