import nodeApi from "./nodeApi";
import { log, logError } from "../config/environment";

/**
 * Save the user's Gemini API key to the DB (encrypted)
 */
export const saveGeminiApiKey = async (userId, apiKey) => {
  try {
    log("[agentService] Saving Gemini API key for user:", userId);
    const res = await nodeApi.post("/gemini-key/save", {
      user_id: userId,
      gemini_api_key: apiKey,
    });
    return res.data;
  } catch (error) {
    logError("[agentService] Failed to save Gemini API key:", error.message);
    throw error;
  }
};

/**
 * Retrieve the user's Gemini API key from the DB (decrypted)
 */
export const fetchGeminiApiKey = async (userId) => {
  try {
    log("[agentService] Fetching Gemini API key for user:", userId);
    const res = await nodeApi.post("/gemini-key/get", { user_id: userId });
    return res.data;
  } catch (error) {
    logError("[agentService] Failed to fetch Gemini API key:", error.message);
    throw error;
  }
};

/**
 * Remove the user's Gemini API key from the DB
 */
export const deleteGeminiApiKey = async (userId) => {
  try {
    log("[agentService] Deleting Gemini API key for user:", userId);
    const res = await nodeApi.post("/gemini-key/delete", { user_id: userId });
    return res.data;
  } catch (error) {
    logError("[agentService] Failed to delete Gemini API key:", error.message);
    throw error;
  }
};
