// import * as fs from "fs";
// import * as path from "path";
// import unzipper from "unzipper";

// interface TraceEntry {
//   type?: string;
//   metadata?: {
//     type?: string;
//     title?: string;
//     error?: {
//       message: string;
//     };
//   };
//   error?: {
//     message?: string;
//   };
// }

// export const parseTraceFromFile = async (
//   traceZipPath: string,
//   outputDir: string
// ): Promise<
//   {
//     testName: string;
//     error: string;
//     traceContext: string[];
//   }[]
// > => {
//   fs.mkdirSync(outputDir, { recursive: true });

//   // Extract the zip
//   await fs
//     .createReadStream(traceZipPath)
//     .pipe(unzipper.Extract({ path: outputDir }))
//     .promise();

//   const extractedFiles = fs.readdirSync(outputDir);
//   console.log("📁 Extracted files:", extractedFiles);

//   const traceFile = extractedFiles.find((file) => file.endsWith(".trace"));

//   if (!traceFile) {
//     throw new Error("No .trace file found in extracted zip.");
//   }

//   const fullPath = path.join(outputDir, traceFile);
//   const content = fs.readFileSync(fullPath, "utf-8");

//   // Parse each line safely
//   const lines: TraceEntry[] = content
//     .trim()
//     .split("\n")
//     .map((line, idx) => {
//       try {
//         return JSON.parse(line);
//       } catch (err) {
//         console.warn(`⚠️ Skipping malformed line ${idx + 1}`);
//         return {};
//       }
//     });

//   console.log("🔍 Total trace entries parsed:", lines.length);

//   const errorIndices = lines.reduce<number[]>((acc, entry, idx) => {
//     if (entry.metadata?.error?.message || entry.error?.message) {
//       acc.push(idx);
//     }
//     return acc;
//   }, []);

//   if (errorIndices.length === 0) {
//     throw new Error("No error found in trace.");
//   }

//   const errors = errorIndices.map((errorIndex) => {
//     const errorMessage =
//       lines[errorIndex].metadata?.error?.message ||
//       lines[errorIndex].error?.message ||
//       "Unknown error";

//     const testName =
//       lines[errorIndex].metadata?.title || "Unknown Test (no title in trace)";

//     const traceContext = lines
//       .slice(Math.max(0, errorIndex - 20), errorIndex + 1)
//       .map((entry) => JSON.stringify(entry).slice(0, 300));

//     return {
//       testName,
//       error: errorMessage,
//       traceContext,
//     };
//   });

//   return errors;
// };

// import * as fs from "fs";
// import * as path from "path";
// import unzipper from "unzipper";

// interface TraceEntry {
//   type?: string;
//   metadata?: {
//     type?: string;
//     title?: string;
//     error?: {
//       message: string;
//     };
//     status?: number;
//   };
//   method?: string;
//   error?: {
//     message?: string;
//   };
// }

// export const parseTraceFromFile = async (
//   traceZipPath: string,
//   outputDir: string
// ): Promise<
//   {
//     testName: string;
//     error: string;
//     traceContext: string[];
//   }[]
// > => {
//   fs.mkdirSync(outputDir, { recursive: true });

//   // Extract the zip
//   await fs
//     .createReadStream(traceZipPath)
//     .pipe(unzipper.Extract({ path: outputDir }))
//     .promise();

//   const extractedFiles = fs.readdirSync(outputDir);
//   console.log("📁 Extracted files:", extractedFiles);

//   const traceFile = extractedFiles.find((file) => file.endsWith(".trace"));
//   if (!traceFile) {
//     throw new Error("No .trace file found in extracted zip.");
//   }

//   const fullPath = path.join(outputDir, traceFile);
//   const content = fs.readFileSync(fullPath, "utf-8");

//   // Parse trace lines safely
//   const lines: TraceEntry[] = content
//     .trim()
//     .split("\n")
//     .map((line, idx) => {
//       try {
//         return JSON.parse(line);
//       } catch {
//         console.warn(`⚠️ Skipping malformed line ${idx + 1}`);
//         return {};
//       }
//     });

//   console.log("🔍 Total trace entries parsed:", lines.length);

//   // Find all error indices in the trace
//   const errorIndices = lines.reduce<number[]>((acc, entry, idx) => {
//     if (entry.metadata?.error?.message || entry.error?.message) {
//       acc.push(idx);
//     }
//     return acc;
//   }, []);

//   if (errorIndices.length === 0) {
//     throw new Error("No error found in trace.");
//   }

//   // Optional: parse .network file for failed network requests
//   const networkFile = extractedFiles.find((f) => f.endsWith(".network"));
//   let networkContext: string[] = [];

//   if (networkFile) {
//     const networkPath = path.join(outputDir, networkFile);
//     const networkContent = fs.readFileSync(networkPath, "utf-8");
//     const networkLines = networkContent
//       .trim()
//       .split("\n")
//       .map((line) => {
//         try {
//           return JSON.parse(line);
//         } catch {
//           return null;
//         }
//       })
//       .filter(Boolean);

//     // Filter failed fetch requests (status >= 400)
//     const failedRequests = networkLines.filter(
//       (req: any) =>
//         req.method === "fetch" &&
//         req.metadata?.status &&
//         req.metadata.status >= 400
//     );

//     if (failedRequests.length > 0) {
//       console.log(
//         `⚠️ Found ${failedRequests.length} failed network request(s)`
//       );
//       networkContext = failedRequests.map((r) =>
//         JSON.stringify(r).slice(0, 300)
//       );
//     }
//   }

//   // Map errors with trace context + network failures
//   const errors = errorIndices.map((errorIndex) => {
//     const errorMessage =
//       lines[errorIndex].metadata?.error?.message ||
//       lines[errorIndex].error?.message ||
//       "Unknown error";

//     const testName =
//       lines[errorIndex].metadata?.title || "Unknown Test (no title in trace)";

//     const traceContext = [
//       ...lines
//         .slice(Math.max(0, errorIndex - 20), errorIndex + 1)
//         .map((entry) => JSON.stringify(entry).slice(0, 300)),
//       ...networkContext,
//     ];

//     return {
//       testName,
//       error: errorMessage,
//       traceContext,
//     };
//   });

//   return errors;
// };



// import * as fs from "fs";
// import * as path from "path";
// import unzipper from "unzipper";

// interface TraceEntry {
//   type?: string;
//   metadata?: {
//     type?: string;
//     title?: string;
//     error?: {
//       message: string;
//     };
//     status?: number;
//     url?: string;
//   };
//   method?: string;
//   error?: {
//     message?: string;
//   };
// }

// export interface ParsedError {
//   testName: string;
//   error: string;
//   traceContext: string[];
//   failedNetworkRequests: string[];
// }

// export const parseTraceFromFile = async (
//   traceZipPath: string,
//   outputDir: string
// ): Promise<ParsedError[]> => {
//   fs.mkdirSync(outputDir, { recursive: true });

//   // Extract the zip
//   await fs
//     .createReadStream(traceZipPath)
//     .pipe(unzipper.Extract({ path: outputDir }))
//     .promise();

//   const extractedFiles = fs.readdirSync(outputDir);
//   console.log("📁 Extracted files:", extractedFiles);

//   // Find main trace file
//   const traceFile = extractedFiles.find((file) => file.endsWith(".trace"));
//   if (!traceFile) {
//     throw new Error("No .trace file found in extracted zip.");
//   }

//   const fullPath = path.join(outputDir, traceFile);
//   const content = fs.readFileSync(fullPath, "utf-8");

//   // Parse trace lines safely
//   const lines: TraceEntry[] = content
//     .trim()
//     .split("\n")
//     .map((line, idx) => {
//       try {
//         return JSON.parse(line);
//       } catch {
//         console.warn(`⚠️ Skipping malformed line ${idx + 1}`);
//         return {};
//       }
//     });

//   console.log("🔍 Total trace entries parsed:", lines.length);

//   // Find all error indices in the trace
//   const errorIndices = lines.reduce<number[]>((acc, entry, idx) => {
//     if (entry.metadata?.error?.message || entry.error?.message) {
//       acc.push(idx);
//     }
//     return acc;
//   }, []);

//   if (errorIndices.length === 0) {
//     throw new Error("No error found in trace.");
//   }

//   // Parse .network file once to get all failed network requests
//   const networkFile = extractedFiles.find((f) => f.endsWith(".network"));
//   let failedNetworkRequestsRaw: any[] = [];

//   if (networkFile) {
//     const networkPath = path.join(outputDir, networkFile);
//     const networkContent = fs.readFileSync(networkPath, "utf-8");
//     const networkLines = networkContent
//       .trim()
//       .split("\n")
//       .map((line) => {
//         try {
//           return JSON.parse(line);
//         } catch {
//           return null;
//         }
//       })
//       .filter(Boolean);

//     // Filter failed fetch requests (status >= 400)
//     failedNetworkRequestsRaw = networkLines.filter(
//       (req: any) =>
//         req.method === "fetch" &&
//         req.metadata?.status &&
//         req.metadata.status >= 400
//     );

//     if (failedNetworkRequestsRaw.length > 0) {
//       console.log(
//         `⚠️ Found ${failedNetworkRequestsRaw.length} failed network request(s)`
//       );
//     }
//   }

//   // For each error, collect trace context and relevant failed network requests
//   const errors: ParsedError[] = errorIndices.map((errorIndex) => {
//     const errorMessage =
//       lines[errorIndex].metadata?.error?.message ||
//       lines[errorIndex].error?.message ||
//       "Unknown error";

//     const testName =
//       lines[errorIndex].metadata?.title || "Unknown Test (no title in trace)";

//     // Get trace lines (20 before + error line)
//     const traceContext = lines
//       .slice(Math.max(0, errorIndex - 20), errorIndex + 1)
//       .map((entry) => JSON.stringify(entry).slice(0, 300));

//     // Optionally filter failed network requests relevant to this error (optional)
//     // For now, we just include all failed network requests globally
//     const failedNetworkRequests = failedNetworkRequestsRaw.map((req) =>
//       JSON.stringify(req).slice(0, 300)
//     );

//     return {
//       testName,
//       error: errorMessage,
//       traceContext,
//       failedNetworkRequests,
//     };
//   });

//   return errors;
// };



import * as fs from "fs";
import * as path from "path";
import unzipper from "unzipper";

interface TraceEntry {
  type?: string;
  metadata?: {
    type?: string;
    title?: string;
    error?: {
      message: string;
    };
    status?: number;
    url?: string;
  };
  method?: string;
  error?: {
    message?: string;
  };
}

export interface ParsedError {
  testName: string;
  error: string;
  traceContext: string[];
  failedNetworkRequests: string[];
}

export const parseTraceFromFile = async (
  traceZipPath: string,
  outputDir: string
): Promise<ParsedError> => {
  fs.mkdirSync(outputDir, { recursive: true });

  // Extract trace.zip
  await fs
    .createReadStream(traceZipPath)
    .pipe(unzipper.Extract({ path: outputDir }))
    .promise();

  const extractedFiles = fs.readdirSync(outputDir);
  console.log("📁 Extracted files:", extractedFiles);

  const traceFile = extractedFiles.find((file) => file.endsWith(".trace"));
  if (!traceFile) throw new Error("No .trace file found in extracted zip.");

  const fullPath = path.join(outputDir, traceFile);
  const content = fs.readFileSync(fullPath, "utf-8");

  const lines: TraceEntry[] = content
    .trim()
    .split("\n")
    .map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch {
        console.warn(`⚠️ Skipping malformed line ${idx + 1}`);
        return {};
      }
    });

  console.log("🔍 Total trace entries parsed:", lines.length);

  const errorIndex = lines.findIndex(
    (entry) => entry.metadata?.error?.message || entry.error?.message
  );

  if (errorIndex === -1) {
    throw new Error("No error found in trace.");
  }

  const errorMessage =
    lines[errorIndex].metadata?.error?.message ||
    lines[errorIndex].error?.message ||
    "Unknown error";

  const testName =
    lines[errorIndex].metadata?.title || "Unknown Test (no title in trace)";

  const traceContext = lines
    .slice(Math.max(0, errorIndex - 20), errorIndex + 1)
    .map((entry) => JSON.stringify(entry).slice(0, 300));

  // Optional: parse .network file
  const networkFile = extractedFiles.find((f) => f.endsWith(".network"));
  let failedNetworkRequests: string[] = [];

  if (networkFile) {
    const networkPath = path.join(outputDir, networkFile);
    const networkContent = fs.readFileSync(networkPath, "utf-8");

    const failedRequests = networkContent
      .trim()
      .split("\n")
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(
        (req: any) =>
          req &&
          req.method === "fetch" &&
          req.metadata?.status &&
          req.metadata.status >= 400
      );

    if (failedRequests.length > 0) {
      console.log(`⚠️ Found ${failedRequests.length} failed network request(s)`);
      failedNetworkRequests = failedRequests.map((r) =>
        JSON.stringify(r).slice(0, 300)
      );
    }
  }

  return {
    testName,
    error: errorMessage,
    traceContext,
    failedNetworkRequests,
  };
};
