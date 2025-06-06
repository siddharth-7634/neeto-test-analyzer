"use strict";
// import express from "express";
// import path from "path";
// import multer from "multer";
// import { parseTraceFromFile } from "../utiils/traceUtils";
// import { getDeepseekExplanation } from "../services/deepseekUtils";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const router = express.Router();
// const upload = multer({ dest: path.join(__dirname, "../../uploads") });
// import { Request } from "express";
// import type { File as MulterFile } from "multer";
// router.post(
//   "/",
//   upload.single("file"),
//   async (req: Request & { file?: MulterFile }, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ error: "Trace file is required." });
//       }
//       const traceZipPath = req.file.path;
//       const outputDir = path.join(
//         __dirname,
//         "../../tmp",
//         Date.now().toString()
//       );
//       const testErrors = await parseTraceFromFile(traceZipPath, outputDir);
//       if (!testErrors.length) {
//         return res.json({
//           message: "✅ No test failures found in trace.",
//           results: [],
//         });
//       }
//       const results = await Promise.all(
//         testErrors.map((errorContext) => getDeepseekExplanation(errorContext))
//       );
//       return res.json({
//         message: "✅ Analysis complete",
//         results,
//       });
//     } catch (err: any) {
//       console.error("❌ Error analyzing trace:", err);
//       return res.status(500).json({ error: "Internal server error." });
//     }
//   }
// );
// export default router;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const traceUtils_1 = require("../utiils/traceUtils");
const deepseekUtils_1 = require("../services/deepseekUtils");
// import {  getOpenAIExplanation } from "../services/deepseekUtils";
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: path_1.default.join(__dirname, "../../uploads") });
// import { getGeminiExplanation } from "../services/deepseekUtils";
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Trace file is required." });
        }
        const traceZipPath = req.file.path;
        const outputDir = path_1.default.join(__dirname, "../../tmp", Date.now().toString());
        const parsedError = await (0, traceUtils_1.parseTraceFromFile)(traceZipPath, outputDir);
        if (!parsedError) {
            return res.json({
                message: "✅ No test failures found in trace.",
                result: null,
            });
        }
        const result = await (0, deepseekUtils_1.getDeepseekExplanation)(parsedError);
        return res.json({
            message: "✅ Analysis complete",
            result,
        });
    }
    catch (err) {
        console.error("❌ Error analyzing trace:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});
exports.default = router;
