// In a new file, e.g., backend2/src/routes/neetoPlayDashProxy.ts
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const NEETO_PLAYDASH_API_BASE =
  "https://automationbinary.neetoplaydash.net/api/v1";
const NEETO_PLAYDASH_API_KEY = process.env.NEETO_PLAYDASH_API_KEY; // From your backend .env
const NEETO_PLAYDASH_SESSION_COOKIE = process.env.NEETO_PLAYDASH_SESSION_COOKIE; // From your backend .env

router.get(
  "/projects/:projectSid/runs/:runSid/test_entities",
  async (req, res) => {
    const { projectSid, runSid } = req.params;
    const { kind } = req.query; // e.g., kind=test

    // Prioritize session cookie if that's what Postman indicates is primary
    if (!NEETO_PLAYDASH_SESSION_COOKIE) {
      return res
        .status(500)
        .json({
          error: "NeetoPlayDash session cookie not configured on server.",
        });
    }

    try {
      const targetUrl = `${NEETO_PLAYDASH_API_BASE}/projects/${projectSid}/runs/${runSid}/test_entities?kind=${kind}`;
      console.log(`Proxying request to: ${targetUrl}`); // Log the target URL

      // NEETO_PLAYDASH_SESSION_COOKIE is guaranteed to be present here due to the check above.
      const headers: Record<string, string> = {
        Cookie: NEETO_PLAYDASH_SESSION_COOKIE, // Primary authentication via cookie
      };

      // If the API key is also required in conjunction with the cookie, uncomment this.
      // if (NEETO_PLAYDASH_API_KEY) {
      //   headers['Authorization'] = `Bearer ${NEETO_PLAYDASH_API_KEY}`;
      //   console.log("DEBUG: Adding Authorization header with API Key."); // For debugging
      // }

      // Log the headers that will be sent
      console.log("Sending headers to NeetoPlayDash:", JSON.stringify(headers, null, 2));

      const apiResponse = await axios.get(targetUrl, {
        headers: headers,
      });
      // Log the actual data received from NeetoPlayDash API
      console.log("Data received from NeetoPlayDash API:", JSON.stringify(apiResponse.data, null, 2));

      res.json(apiResponse.data);
    } catch (error: any) {
      console.error(
        "Error proxying to NeetoPlayDash:",
        error.response?.data || error.message
      );
      res.status(error.response?.status || 500).json({
        error: "Failed to fetch data from NeetoPlayDash",
        details: error.response?.data,
      });
    }
  }
);

// Route for fetching a single test entity's details
router.get(
  "/projects/:projectSid/runs/:runSid/test_entities/:testEntitySid",
  async (req, res) => {
    const { projectSid, runSid, testEntitySid } = req.params;

    if (!NEETO_PLAYDASH_SESSION_COOKIE) {
      return res
        .status(500)
        .json({
          error: "NeetoPlayDash session cookie not configured on server.",
        });
    }

    try {
      const targetUrl = `${NEETO_PLAYDASH_API_BASE}/projects/${projectSid}/runs/${runSid}/test_entities/${testEntitySid}`;
      console.log(`Proxying SINGLE ENTITY request to: ${targetUrl}`); // Log the target URL

      const headers: Record<string, string> = {
        Cookie: NEETO_PLAYDASH_SESSION_COOKIE,
      };

      // if (NEETO_PLAYDASH_API_KEY) {
      //   headers['Authorization'] = `Bearer ${NEETO_PLAYDASH_API_KEY}`;
      //   console.log("DEBUG: Adding Authorization header with API Key for single entity.");
      // }

      console.log("Sending headers to NeetoPlayDash (single entity):", JSON.stringify(headers, null, 2));

      const apiResponse = await axios.get(targetUrl, {
        headers: headers,
      });
      console.log("Data received from NeetoPlayDash API (single entity):", JSON.stringify(apiResponse.data, null, 2));
      res.json(apiResponse.data);
    } catch (error: any) {
      console.error("Error proxying to NeetoPlayDash (single entity):", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: "Failed to fetch single test entity data from NeetoPlayDash",
        details: error.response?.data,
      });
    }
  }
);

export default router;
