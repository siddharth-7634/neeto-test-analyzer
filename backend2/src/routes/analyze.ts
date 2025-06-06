// import express from "express";
// import path from "path";
// import multer from "multer";
// import { parseTraceFromFile } from "../utiils/traceUtils";
// import { getDeepseekExplanation } from "../services/deepseekUtils";

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

import express from "express";
import path from "path";
import multer from "multer";
import { parseTraceFromFile } from "../utiils/traceUtils";
import { getDeepseekExplanation } from "../services/deepseekUtils";
// import {  getOpenAIExplanation } from "../services/deepseekUtils";

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, "../../uploads") });

import { Request } from "express";
import type { File as MulterFile } from "multer";
// import { getGeminiExplanation } from "../services/deepseekUtils";

router.post(
  "/",
  upload.single("file"),
  async (req: Request & { file?: MulterFile }, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Trace file is required." });
      }

      const traceZipPath = req.file.path;
      const outputDir = path.join(
        __dirname,
        "../../tmp",
        Date.now().toString()
      );

      const parsedError = await parseTraceFromFile(traceZipPath, outputDir);

      if (!parsedError) {
        return res.json({
          message: "✅ No test failures found in trace.",
          result: null,
        });
      }

      const result = await getDeepseekExplanation(parsedError);

      return res.json({
        message: "✅ Analysis complete",
        result,
      });
    } catch (err: any) {
      console.error("❌ Error analyzing trace:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
