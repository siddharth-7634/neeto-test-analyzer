// import axios from "axios";

// export interface TraceContext {
//   testName: string;
//   error: string;
//   traceContext: string[];
// }

// interface DeepseekResult {
//   testName: string;
//   error: string;
//   reason: string;
//   fix: string;
//   summaryText: string;
// }

// export const getDeepseekExplanation = async (
//   context: TraceContext
// ): Promise<DeepseekResult> => {
//   const prompt = `
// You are a Playwright test assistant.

// Analyze this test failure and return the root cause and a simple fix.

// Format your output JSON like:
// {
//   "reason": "...",
//   "fix": "...",
//   "summaryText": "🔴 *Test Failed*: ${context.testName}\\n🧩 *Reason*: ...\\n💡 *Fix*: ..."
// }

// Test: ${context.testName}
// Error: ${context.error}

// Context:
// ${context.traceContext.join("\n")}
// `;

//   try {
//     const response = await axios.post(
//       "https://api.deepseek.com/v1/chat/completions",
//       {
//         model: "deepseek-coder",
//         messages: [{ role: "user", content: prompt }],
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     let raw = response.data.choices?.[0]?.message?.content ?? "";

//     // 🔥 Clean up Markdown (remove ```json ... ```)
//     raw = raw.replace(/```json\s*([\s\S]*?)```/, "$1").trim();
//     raw = raw.replace(/```[\s\S]*?```/, "").trim(); // fallback for generic triple backticks

//     const parsed = JSON.parse(raw);

//     return {
//       testName: context.testName,
//       error: context.error,
//       reason: parsed.reason ?? "Unknown reason",
//       fix: parsed.fix ?? "No fix provided",
//       summaryText: parsed.summaryText ?? "No summary generated",
//     };
//   } catch (error: any) {
//     console.error("🧠 Deepseek error:", error.response?.data || error.message);
//     return {
//       testName: context.testName,
//       error: context.error,
//       reason: "Failed to analyze error.",
//       fix: "Try rerunning the test or improving trace context.",
//       summaryText: `🔴 *Test Failed*: ${context.testName}\n💥 Deepseek failed to explain the issue.`,
//     };
//   }
// };

import axios from "axios";

export interface TraceContext {
  testName: string;
  error: string;
  traceContext: string[];
  failedNetworkRequests?: string[]; // Optional, if you want to pass this later
}

interface DeepseekResult {
  // testName: string;
  error: string;
  reason: string;
  fix: string;
  summaryText: string;
}

export const getDeepseekExplanation = async (
  context: TraceContext
): Promise<DeepseekResult> => {
  //   const prompt = `
  // You are a Playwright test assistant.

  // Analyze this test failure and return the root cause and a simple fix.

  // Format your output JSON like:
  // {
  //   "reason": "...",
  //   "fix": "...",
  //   "summaryText": "🔴 *Test Failed*: ${
  //     context.testName
  //   }\\n🧩 *Reason*: ...\\n💡 *Fix*: ..."
  // }

  // Test: ${context.testName}
  // Error: ${context.error}

  // Context:
  // ${context.traceContext.join("\n")}
  // `;

  const prompt = `
You are a Playwright test failure analysis assistant.

Given the test failure name, error message, and trace logs including network requests and other metadata, analyze the failure and determine:

1. The most likely root cause(s) of the failure.
2. How upstream network or API failures might contribute.
3. Any common issues like element not found, timeouts, selector errors, or test setup problems.
4. Suggested actionable fixes or debugging steps.

Format your answer as JSON like:

{
  "reason": "Explain the root cause in simple terms",
  "fix": "Provide actionable fixes or next steps",
  "summaryText": "🔴 *Test Failed*: ${
    context.testName
  }\\n🧩 *Reason*: ...\\n💡 *Fix*: ..."
}

Test: ${context.testName}
Error: ${context.error}

Trace Context:
${context.traceContext.join("\n")}
`;

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-coder",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let raw = response.data.choices?.[0]?.message?.content ?? "";

    // Clean up Markdown code blocks from response
    raw = raw.replace(/```json\s*([\s\S]*?)```/, "$1").trim();
    raw = raw.replace(/```[\s\S]*?```/, "").trim(); // fallback for any triple backticks

    const parsed = JSON.parse(raw);

    return {
      // testName: context.testName,
      error: context.error,
      reason: parsed.reason ?? "Unknown reason",
      fix: parsed.fix ?? "No fix provided",
      summaryText: parsed.summaryText ?? "No summary generated",
    };
  } catch (error: any) {
    console.error("🧠 Deepseek error:", error.response?.data || error.message);
    return {
      // testName: context.testName,
      error: context.error,
      reason: "Failed to analyze error.",
      fix: "Try rerunning the test or improving trace context.",
      summaryText: `🔴 *Test Failed*: ${context.testName}\n💥 Deepseek failed to explain the issue.`,
    };
  }
};

// import axios from "axios";

// export interface TraceContext {
//   testName: string;
//   error: string;
//   traceContext: string[];
//   failedNetworkRequests?: string[];
// }

// interface GeminiResult {
//   testName: string;
//   error: string;
//   reason: string;
//   fix: string;
//   summaryText: string;
// }

// export const getGeminiExplanation = async (
//   context: TraceContext
// ): Promise<GeminiResult> => {
//   const prompt = `
// You are a Playwright test failure analysis assistant.

// Given the test failure name, error message, and trace logs including network requests and other metadata, analyze the failure and determine:

// 1. The most likely root cause(s) of the failure.
// 2. How upstream network or API failures might contribute.
// 3. Any common issues like element not found, timeouts, selector errors, or test setup problems.
// 4. Suggested actionable fixes or debugging steps.

// Format your answer STRICTLY as a single, valid JSON object. Do NOT include any explanatory text or markdown formatting outside of the JSON object itself. For example:

// {
//   "reason": "Explain the root cause in simple terms",
//   "fix": "Provide actionable fixes or next steps",
//   "summaryText": "🔴 *Test Failed*: ${context.testName}\\n🧩 *Reason*: [AI generated reason]\\n💡 *Fix*: [AI generated fix]"
// }

// Test: ${context.testName}
// Error: ${context.error}

// Trace Context:
// ${context.traceContext.join("\n")}
// `; // Note: I slightly modified the example in the prompt for clarity for the AI

//   try {
//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.DEEPSEEK_API_KEY}`,
//       {
//         contents: [
//           {
//             parts: [{ text: prompt }],
//           },
//         ],
//         // *** UNCOMMENT AND USE THIS ***
//         generationConfig: {
//           // temperature: 0.7, // Optional: Adjust as needed
//           // topK: 1,          // Optional: Adjust as needed
//           // topP: 1,          // Optional: Adjust as needed
//           // maxOutputTokens: 2048, // Optional: Adjust as needed
//           responseMimeType: "application/json", // Ensure Gemini outputs JSON
//         },
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     // When using responseMimeType: "application/json", the response should ideally be clean JSON already.
//     // The .text should directly be the JSON string.
//     let raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

//     // CRITICAL: Log the raw response to see what Gemini is actually sending
//     // console.log("-----------RAW RESPONSE FROM GEMINI START-----------");
//     // console.log(raw);
//     // console.log("-----------RAW RESPONSE FROM GEMINI END-----------");

//     // With responseMimeType: "application/json", complex cleanup might not be needed.
//     // However, it's good to keep a simple trim.
//     raw = raw.trim();

//     const parsed = JSON.parse(raw); // Error occurs here if 'raw' is still not perfect JSON

//     // Ensure the summary text is correctly templated
//     let summaryText = parsed.summaryText;
//     // If Gemini is supposed to fill "..." in the template, ensure your logic handles that.
//     // The prompt example above now suggests the AI fill it directly.
//     if (summaryText && summaryText.includes("[AI generated reason]") && summaryText.includes("[AI generated fix]")) {
//         summaryText = `🔴 *Test Failed*: ${context.testName}\n🧩 *Reason*: ${parsed.reason}\n💡 *Fix*: ${parsed.fix}`;
//     } else if (!summaryText && parsed.reason && parsed.fix) {
//         summaryText = `🔴 *Test Failed*: ${context.testName}\n🧩 *Reason*: ${parsed.reason}\n💡 *Fix*: ${parsed.fix}`;
//     }

//     return {
//       testName: context.testName,
//       error: context.error,
//       reason: parsed.reason ?? "Unknown reason",
//       fix: parsed.fix ?? "No fix provided",
//       summaryText:
//         summaryText ??
//         `🔴 *Test Failed*: ${context.testName}\n🧩 *Reason*: ${
//           parsed.reason ?? "Unknown"
//         }\n💡 *Fix*: ${parsed.fix ?? "N/A"}`,
//     };
//   } catch (error: any) {
//     // Distinguish between API error and parsing error
//     if (error instanceof SyntaxError) { // JSON.parse error
//         console.error("🧠 JSON Parse error:", error.message);
//         // The 'raw' variable won't be in scope here unless you log it before parsing
//         // or pass it to the error.
//         console.error("Failed to parse the following string (see raw response log above).");
//     } else { // API or other error
//         console.error("🧠 Gemini API/Network error:", error.response?.data || error.message);
//     }

//     const errorMessage = error.response?.data?.error?.message || error.message;
//     return {
//       testName: context.testName,
//       error: context.error,
//       reason: `Failed to analyze error. Gemini interaction Error: ${errorMessage}`,
//       fix: "Try rerunning the test, improving trace context, or checking the API key and model availability. Also check the console logs for the raw Gemini response.",
//       summaryText: `🔴 *Test Failed*: ${context.testName}\n💥 Gemini failed to explain the issue. Error: ${errorMessage}`,
//     };
//   }
// };

// import axios from "axios";

// export interface TraceContext {
//   testName: string;
//   error: string;
//   traceContext: string[];
//   failedNetworkRequests?: string[];
// }

// interface AnalysisResult {
//   testName: string;
//   error: string;
//   reason: string;
//   fix: string;
//   summaryText: string;
// }

// export const getOpenAIExplanation = async (
//   context: TraceContext
// ): Promise<AnalysisResult> => {
//   const prompt = `
// You are a Playwright test failure analysis assistant.

// Given the test failure name, error message, and trace logs including network requests and other metadata, analyze the failure and determine:

// 1. The most likely root cause(s) of the failure.
// 2. How upstream network or API failures might contribute.
// 3. Any common issues like element not found, timeouts, selector errors, or test setup problems.
// 4. Suggested actionable fixes or debugging steps.

// Format your answer as JSON like:

// {
//   "reason": "Explain the root cause in simple terms",
//   "fix": "Provide actionable fixes or next steps",
//   "summaryText": "🔴 *Test Failed*: ${context.testName}\\n🧩 *Reason*: ...\\n💡 *Fix*: ..."
// }

// Test: ${context.testName}
// Error: ${context.error}

// Trace Context:
// ${context.traceContext.join("\n")}
// `;

//   try {
//     const response = await axios.post(
//       "https://api.openai.com/v1/chat/completions",
//       {
//         model: "gpt-3.5", // or use "gpt-4o", "gpt-3.5-turbo" based on availability
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.3,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     let raw = response.data.choices?.[0]?.message?.content ?? "";

//     // Clean up Markdown code blocks
//     raw = raw.replace(/```json\s*([\s\S]*?)```/, "$1").trim();
//     raw = raw.replace(/```[\s\S]*?```/, "").trim();

//     const parsed = JSON.parse(raw);

//     return {
//       testName: context.testName,
//       error: context.error,
//       reason: parsed.reason ?? "Unknown reason",
//       fix: parsed.fix ?? "No fix provided",
//       summaryText: parsed.summaryText ?? "No summary generated",
//     };
//   } catch (error: any) {
//     console.error("🧠 OpenAI error:", error.response?.data || error.message);
//     return {
//       testName: context.testName,
//       error: context.error,
//       reason: "Failed to analyze error.",
//       fix: "Try rerunning the test or improving trace context.",
//       summaryText: `🔴 *Test Failed*: ${context.testName}\n💥 OpenAI failed to explain the issue.`,
//     };
//   }
// };
