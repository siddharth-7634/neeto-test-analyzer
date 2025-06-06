import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import unzipper from "unzipper";

interface TraceEntry {
  type?: string;
  metadata?: {
    type?: string;
    error?: {
      message: string;
    };
    errors?: any[];
  };
}

const downloadAndExtractTrace = async (
  traceZipUrl: string,
  outputDir: string
): Promise<void> => {
  const zipPath = path.join(outputDir, "trace.zip");

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Download the zip
  const response = await axios({
    method: "GET",
    url: encodeURI(traceZipUrl),
    responseType: "stream",
  });

  const writer = fs.createWriteStream(zipPath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(undefined));
    writer.on("error", reject);
  });

  await fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: outputDir }))
    .promise();

  console.log("✅ Trace file downloaded and extracted.");
};

const parseTrace = async (outputDir: string): Promise<void> => {
  const traceFile = path.join(outputDir, "1-trace.trace");

  if (!fs.existsSync(traceFile)) {
    throw new Error("trace.trace file not found in extracted zip.");
  }

  const content = fs.readFileSync(traceFile, "utf-8");
  const lines: TraceEntry[] = content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  // 1. Print distinct type values
  const typeSet = new Set<string>();
  lines.forEach((entry) => {
    if (entry.type) typeSet.add(entry.type);
  });
  console.log("📌 Distinct trace entry types:", [...typeSet]);

  // 2. Find and print last error
  const lastError = [...lines]
    .reverse()
    .find((entry) => entry.metadata?.error?.message);

  if (lastError?.metadata?.error?.message) {
    console.log("❌ Last Error:", lastError.metadata.error.message);
  } else {
    console.log("✅ No error found in trace.");
  }

  // 3. Optionally print sample entries
  console.log("\n📄 Sample trace entries:");
  console.log(JSON.stringify(lines.slice(0, 3), null, 2));
};

const runAnalysis = async () => {
  const traceZipUrl =
    // "https://assets-cdn.neetoplaydash.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6ImYzYTg4YmU3LWQ1MDgtNDE1Yi05NThhLWE0MzFjYjI4ZDdmYiIsInB1ciI6ImJsb2JfaWQifX0=--82f879f8b5b825282baaf40a03a20af18257798e/-home-neetoci-neeto-invoice-web-playwright-tests-test-results-invoice-Verify-invoices-sh-b6847-oice-email-and-invoice-link-chromium-retry1-trace.zip";

    // "https://assets-cdn.neetoplaydash.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6IjhjZjZlODlkLTMyOWUtNGZhNi05MzFiLWYxNTUyYmZmMWQ1MyIsInB1ciI6ImJsb2JfaWQifX0=--66b143d53238626ad69546d63a15a1abe7e5288b/-home-neetoci-neeto-chat-web-playwright-tests-test-results-inbox-conversations-Inbox--fa890-add-edit-from-right-sidebar-chromium-retry1-trace.zip";

    "https://assets-cdn.neetoplaydash.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6ImFlNDgzYWI0LWE2ZjMtNDQ2Yi04MmYzLWRmMzBmZTU5MTRmYyIsInB1ciI6ImJsb2JfaWQifX0=--8f3077b1a1526aad7366f54d9b8d71118186a5bf/-home-neetoci-neeto-chat-web-playwright-tests-test-results-inbox-conversationViews-In-7a663--filter-closed-conversation-chromium-retry1-trace.zip"

  const outputDir = path.join(__dirname, "trace-extracted");

  try {
    await downloadAndExtractTrace(traceZipUrl, outputDir);
    await parseTrace(outputDir);
  } catch (err) {
    console.error("⚠️ Error during trace analysis:", err);
  }
};

runAnalysis();
