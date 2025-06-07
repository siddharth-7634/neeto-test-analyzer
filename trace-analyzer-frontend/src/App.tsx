import { useState } from "react";
import "./App.css"; // Ensure Tailwind is imported here or in index.css

// --- Configuration ---
// const NEETO_PLAYDASH_API_BASE_DIRECT = import.meta.env.VITE_NEETO_PLAYDASH_API_BASE_DIRECT || 'https://automationbinary.neetoplaydash.com/api/v1'; // Keep for reference if needed
const PROXIED_NEETO_PLAYDASH_API_BASE =
  import.meta.env.VITE_PROXIED_NEETO_PLAYDASH_API_BASE ||
  "http://localhost:3001/api/neetoplaydash-proxy"; // URL for your backend proxy

const ANALYZER_BACKEND_URL =
  import.meta.env.VITE_ANALYZER_BACKEND_URL || "http://localhost:3001/analyze"; // Default to 3001 to match backend
const NEETO_PLAYDASH_API_KEY = import.meta.env.VITE_NEETO_PLAYDASH_API_KEY;
// --- Type Definitions ---
interface NeetoTestEntity {
  id: string;
  title: string;
  sid: string; // from your data
  project: string; // from your data
  status: "passed" | "failed" | "skipped" | "pending";
  duration: number; // from your data
  started_at: string; // from your data
}

interface NeetoTestEntitiesResponse {
  test_entities: NeetoTestEntity[]; // Correct key based on actual API response
  run_details?: object; // Optional: if you want to use this later
  total_count?: number; // Optional: if you want to use this later
}

interface TestAttempt {
  traces?: string[];
  // ... other attempt properties if needed (e.g., status, duration)
}

interface TestOutcome {
  status: string;
  attempts: TestAttempt[]; // Each outcome has an array of attempts
  // ... other outcome properties if needed
}

interface NeetoSingleTestEntityResponse {
  test: {
    title: string;
    outcomes: TestOutcome[];
    // ... other properties from the "test" object if needed (e.g., sid, id)
  };
  project?: string; // Optional, from the root
}

interface BackendAnalysisResult {
  testName: string;
  error: string;
  reason: string;
  fix: string;
  summaryText: string;
}

interface DisplayableAnalysisResult {
  testTitle: string;
  testSid: string;
  analysis?: BackendAnalysisResult | null;
  status:
    | "pending"
    | "fetching_trace"
    | "analyzing"
    | "completed"
    | "error"
    | "no_retry_trace"
    | "analysis_failed";
  errorMessage?: string;
  originalTraceUrl?: string;
}

function App() {
  const [runUrl, setRunUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<
    DisplayableAnalysisResult[]
  >([]);
  const [overallError, setOverallError] = useState<string | null>(null);

  const addStatus = (message: string) => {
    setStatusMessages((prev) => [...prev, message]);
  };

  const extractSids = (
    url: string
  ): { projectSid: string; runSid: string } | null => {
    const match = url.match(/\/projects\/([a-zA-Z0-9]+)\/runs\/([a-zA-Z0-9]+)/);
    if (match && match[1] && match[2]) {
      return { projectSid: match[1], runSid: match[2] };
    }
    return null;
  };

  const handleAnalyzeRun = async () => {
    setIsLoading(true);
    setOverallError(null);
    setStatusMessages([]);
    setAnalysisResults([]);
    addStatus("Starting analysis...");

    const sids = extractSids(runUrl);
    if (!sids) {
      setOverallError("Invalid NeetoPlayDash Run URL format.");
      addStatus(
        "Error: Invalid URL format. Expected .../projects/{project_sid}/runs/{run_sid}..."
      );
      setIsLoading(false);
      return;
    }
    const { projectSid, runSid } = sids;
    addStatus(`Project SID: ${projectSid}, Run SID: ${runSid}`);

    try {
      // Step 1: Fetch all test entities for the run
      addStatus("Fetching test entities...");
      // Calls to your proxy do not need credentials or Authorization header from frontend
      // The backend proxy handles authentication with the actual NeetoPlayDash API.
      const testEntitiesUrl = `${PROXIED_NEETO_PLAYDASH_API_BASE}/projects/${projectSid}/runs/${runSid}/test_entities?kind=test`;
      const response = await fetch(testEntitiesUrl); // No credentials, no explicit headers here

      if (!response.ok) {
        let errorDetails = `Server responded with ${response.status}`;
        try {
          const errorBody = await response.json();
          errorDetails =
            errorBody.message || errorBody.error || JSON.stringify(errorBody);
        } catch {
          // If response is not JSON, use statusText
          errorDetails = response.statusText;
        }
        throw new Error(`Failed to fetch test entities: ${errorDetails}`);
      }
      // Expect an object with a 'data' property which is an array
      const testEntitiesData: NeetoTestEntitiesResponse = await response.json();

      // CRITICAL: Check if testEntitiesData and testEntitiesData.data exist and are an array
      if (!testEntitiesData || !Array.isArray(testEntitiesData.test_entities)) {
        // Check for 'test_entities'
        addStatus(
          "Error: Received malformed data for test entities from the server."
        );
        throw new Error("Received malformed data for test entities.");
      }

      // Now use testEntitiesData.data
      const failedTests = testEntitiesData.test_entities.filter(
        // Use 'test_entities'
        (test) => test.status === "failed" // Access status directly
      );

      if (failedTests.length === 0) {
        addStatus("No failed tests found in this run.");
        setIsLoading(false);
        return;
      }
      addStatus(`Found ${failedTests.length} failed test(s).`);

      // Initialize results state
      setAnalysisResults(
        failedTests.map((ft) => ({
          testSid: ft.sid,
          testTitle: ft.title, // Access title directly
          status: "pending",
        }))
      );

      for (let i = 0; i < failedTests.length; i++) {
        const failedTest = failedTests[i];
        const currentTestShortId = failedTest.sid; // Use the short 'sid' for URL and matching
        const testTitle = failedTest.title;

        const updateTestStatus = (
          status: DisplayableAnalysisResult["status"],
          errorMessage?: string,
          analysis?: BackendAnalysisResult | null,
          originalTraceUrl?: string
        ) => {
          setAnalysisResults((prev) =>
            prev.map((r) =>
              r.testSid === currentTestShortId // Compare with the short 'sid' stored in analysisResults
                ? { ...r, status, errorMessage, analysis, originalTraceUrl }
                : r
            )
          );
        };

        addStatus(
          `Processing failed test: ${testTitle} (SID: ${currentTestShortId})`
        );
        updateTestStatus("fetching_trace");

        try {
          // Step 2: Fetch details for the specific failed test
          const singleTestUrl = `${PROXIED_NEETO_PLAYDASH_API_BASE}/projects/${projectSid}/runs/${runSid}/test_entities/${currentTestShortId}`; // Use short 'sid' in URL
          addStatus(`Fetching details for ${testTitle}...`);
          const singleTestResponse = await fetch(singleTestUrl); // No credentials, no explicit headers here

          if (!singleTestResponse.ok) {
            let errorDetails = `Server responded with ${singleTestResponse.status}`;
            try {
              const errorBody = await singleTestResponse.json();
              errorDetails =
                errorBody.message ||
                errorBody.error ||
                JSON.stringify(errorBody);
            } catch {
              errorDetails = singleTestResponse.statusText;
            }
            throw new Error(
              `Failed to fetch details for test ${currentTestShortId}: ${errorDetails}`
            );
          }
          const singleTestData: NeetoSingleTestEntityResponse =
            await singleTestResponse.json();

          // DEBUG: Log the structure of singleTestData
          // console.log("DEBUG: singleTestData received from proxy:", JSON.stringify(singleTestData, null, 2));

          // CRITICAL: Check the structure of singleTestData
          if (
            !singleTestData ||
            !singleTestData.test || // Check if 'test' object exists
            !Array.isArray(singleTestData.test.outcomes) // Check if 'outcomes' is an array
          ) {
            console.error(
              "Malformed singleTestData: 'test' object or 'test.outcomes' array is missing or not an array.",
              singleTestData
            );
            updateTestStatus(
              "error",
              "Received malformed data for single test details."
            );
            continue; // Skip to the next test
          }

          // Get traces from the first attempt of the last outcome
          let selectedTraceUrl: string | undefined;
          const outcomes = singleTestData.test.outcomes;

          if (outcomes.length > 0) {
            const lastOutcome = outcomes[outcomes.length - 1];
            if (
              lastOutcome.attempts &&
              Array.isArray(lastOutcome.attempts) &&
              lastOutcome.attempts.length > 0
            ) {
              const firstAttemptOfLastOutcome = lastOutcome.attempts[0];
              if (
                firstAttemptOfLastOutcome.traces &&
                Array.isArray(firstAttemptOfLastOutcome.traces) &&
                firstAttemptOfLastOutcome.traces.length > 0
              ) {
                selectedTraceUrl = firstAttemptOfLastOutcome.traces[0]; // Take the first trace from the first attempt of the last outcome
              }
            }
          }

          if (!selectedTraceUrl) {
            addStatus(`No traces found for test ${testTitle}.`);
            updateTestStatus(
              "no_retry_trace",
              "No traces listed for this test."
            );
            continue;
          }

          // The user requested to use the 0th index element from attempts.
          // The logic above now selects the first trace from the first attempt of the last outcome.
          // We no longer search for "retry1".
          addStatus(`Using trace for ${testTitle}: ${selectedTraceUrl}`);
          updateTestStatus(
            "fetching_trace",
            undefined,
            undefined,
            selectedTraceUrl
          );

          // Step 3: Fetch the trace.zip file
          addStatus(`Downloading trace file for ${testTitle}...`);
          // IMPORTANT: If assets-cdn.neetoplaydash.com has CORS issues, this fetch will fail.
          // A backend proxy might be needed for this step in a production environment.
          // This URL is still direct, as it's to assets-cdn, not the main API.
          // If this also causes CORS, it would need its own proxy or different handling.
          const traceFileResponse = await fetch(selectedTraceUrl, {
            // credentials: 'include', // Usually not needed for public CDNs; could cause issues if CDN CORS isn't set for credentials
            // headers: NEETO_PLAYDASH_API_KEY ? { 'Authorization': `Bearer ${NEETO_PLAYDASH_API_KEY}` } : {} // Potentially remove or adjust
          });
          if (!traceFileResponse.ok) {
            // Trace file download might not return JSON error, so just use statusText
            throw new Error(
              `Failed to download trace file: ${traceFileResponse.status} ${traceFileResponse.statusText}`
            );
          }
          const traceBlob = await traceFileResponse.blob();
          addStatus(
            `Trace file downloaded for ${testTitle}. Size: ${traceBlob.size} bytes.`
          );

          // Step 4: Send the trace blob to your backend /analyze endpoint
          updateTestStatus("analyzing");
          addStatus(`Sending trace for ${testTitle} to analyzer backend...`);
          const formData = new FormData();
          // Extract filename from URL or use a generic one
          const traceFilename =
            selectedTraceUrl.substring(selectedTraceUrl.lastIndexOf("/") + 1) ||
            "trace.zip";
          formData.append(
            "file",
            new File([traceBlob], traceFilename, { type: "application/zip" })
          );

          const analysisApiResponse = await fetch(ANALYZER_BACKEND_URL, {
            method: "POST",
            body: formData,
          });

          if (!analysisApiResponse.ok) {
            const errorJson = await analysisApiResponse
              .json()
              .catch(() => ({ error: "Unknown analysis error" }));
            throw new Error(
              `Analysis backend error for ${testTitle}: ${
                errorJson.error || analysisApiResponse.status
              }`
            );
          }
          const analysisData = await analysisApiResponse.json();
          // DEBUG: Log the data received from the /analyze endpoint
          console.log("DEBUG: analysisData from /analyze backend:", JSON.stringify(analysisData, null, 2));

          if (analysisData.result) {
            // analysisData.result is an array of BackendAnalysisResult objects.
            // For a single trace file analysis, we expect one result if an error was found and analyzed.
            if (Array.isArray(analysisData.result) && analysisData.result.length > 0 && analysisData.result[0]) {
              // The first element of the array IS the analysis result.
              const mainAnalysis: BackendAnalysisResult = analysisData.result[0];
              addStatus(`Analysis complete for ${testTitle}.`);
              updateTestStatus("completed", undefined, mainAnalysis);
            } else {
              // This case handles if analysisData.result is an empty array or items are malformed.
              console.error("DEBUG: analysisData.result was not a non-empty array or first item was falsy", analysisData.result);
              // Handle cases where the structure is not as expected or explanation is missing
              addStatus(`Analysis for ${testTitle} returned an unexpected result structure.`);
              updateTestStatus("analysis_failed", "Malformed analysis data from server.");
            }
          } else {
            addStatus(
              `Analysis for ${testTitle} returned no specific result or explanation: ${
                analysisData.message || "Unknown reason"
              }`
            );
            updateTestStatus(
              "analysis_failed",
              analysisData.message || "Analysis did not return a result."
            );
          }
        } catch (testError: unknown) {
          const errorMsg =
            testError instanceof Error ? testError.message : String(testError);
          addStatus(`Error processing test ${testTitle}: ${errorMsg}`);
          updateTestStatus("error", errorMsg);
        }
      }
      addStatus("All failed tests processed.");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addStatus(`Overall Error: ${errorMessage}`);
      setOverallError(errorMessage);
    } finally {
      setIsLoading(false);
      addStatus("Process finished.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-sky-400 mb-2">
            Neeto Test Analyzer
          </h1>
          <p className="text-gray-400">
            Enter a NeetoPlayDash run URL to analyze failed tests.
          </p>
        </header>

        {!NEETO_PLAYDASH_API_KEY && (
          <section className="mb-6 p-4 bg-yellow-700 text-yellow-100 rounded-md shadow">
            <h2 className="font-semibold text-lg mb-1">
              Configuration Warning:
            </h2>
            <p>
              The NeetoPlayDash API Key (VITE_NEETO_PLAYDASH_API_KEY) is not set
              in your environment variables. API calls to NeetoPlayDash may
              fail.
            </p>
          </section>
        )}

        <section className="mb-8 p-6 bg-gray-800 rounded-lg shadow-xl">
          <div className="mb-4">
            <label
              htmlFor="runUrl"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              NeetoPlayDash Run URL:
            </label>
            <input
              type="url"
              id="runUrl"
              value={runUrl}
              onChange={(e) => setRunUrl(e.target.value)}
              placeholder="https://automationbinary.neetoplaydash.net/admin/projects/.../runs/..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-gray-100 placeholder-gray-500"
            />
          </div>
          <button
            onClick={handleAnalyzeRun}
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
          >
            {isLoading ? "Analyzing..." : "Start Analysis"}
          </button>
        </section>

        {overallError && (
          <section className="mb-6 p-4 bg-red-800 text-red-100 rounded-md shadow">
            <h2 className="font-semibold text-lg mb-1">Error:</h2>
            <p>{overallError}</p>
          </section>
        )}

        {(isLoading || statusMessages.length > 0) && (
          <section className="mb-6 p-6 bg-gray-800 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold text-sky-400 mb-3">
              Progress Log:
            </h2>
            <div className="max-h-60 overflow-y-auto bg-gray-900 p-3 rounded-md border border-gray-700">
              {statusMessages.map((msg, index) => (
                <p
                  key={index}
                  className="text-sm text-gray-300 mb-1 font-mono"
                >{`[${new Date().toLocaleTimeString()}] ${msg}`}</p>
              ))}
            </div>
          </section>
        )}

        {analysisResults.length > 0 && (
          <section className="p-6 bg-gray-800 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-sky-400 mb-4">
              Analysis Results:
            </h2>
            <div className="space-y-6">
              {analysisResults.map((result) => (
                <div
                  key={result.testSid}
                  className="p-4 bg-gray-700 rounded-md shadow border border-gray-600"
                >
                  <h3 className="text-lg font-semibold text-sky-300 mb-1">
                    {result.testTitle}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    SID: {result.testSid}
                  </p>
                  <p className="text-sm text-gray-400 mb-2">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        result.status === "completed"
                          ? "text-green-400"
                          : result.status === "error" ||
                            result.status === "analysis_failed"
                          ? "text-red-400"
                          : result.status === "no_retry_trace"
                          ? "text-yellow-400"
                          : "text-blue-400"
                      }`}
                    >
                      {result.status.replace("_", " ")}
                    </span>
                  </p>

                  {result.originalTraceUrl && (
                    <p className="text-xs text-gray-500 mb-2">
                      Trace:{" "}
                      {result.originalTraceUrl.substring(
                        result.originalTraceUrl.lastIndexOf("/") + 1
                      )}
                    </p>
                  )}

                  {result.status === "completed" && result.analysis && (
                    <div className="mt-3 space-y-2 text-left">
                      <div>
                        <strong className="text-sky-400">Summary:</strong>
                        <pre className="mt-1 bg-gray-800 p-3 rounded-md text-sm text-gray-200 whitespace-pre-wrap overflow-x-auto border border-gray-600">
                          {result.analysis.summaryText}
                        </pre>
                      </div>
                      {/* <div>
                        <strong className="text-sky-400">Reason:</strong>
                        <p className="mt-1 text-sm text-gray-300">{result.analysis.reason}</p>
                      </div>
                      <div>
                        <strong className="text-sky-400">Suggested Fix:</strong>
                        <p className="mt-1 text-sm text-gray-300">{result.analysis.fix}</p>
                      </div> */}
                    </div>
                  )}
                  {result.errorMessage && (
                    <p className="mt-2 text-sm text-red-300 bg-red-900 p-2 rounded-md">
                      Error: {result.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
