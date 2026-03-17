/**
 * File Name: dropdownService.js
 * Author: Naitik Maisuriya
 * Description: Service for fetching dynamic dropdown data used in user management forms.
 */

import api from "./api";

/**
 * Fetches data for a specific dropdown category from the backend.
 * @param {string} dropdownType - The type of data to retrieve.
 * @param {number|null} projectId - Optional project ID for filtering.
 * @param {number|null} userId - Optional logged in user ID for filtering (required for agent dropdown).
 */
export const fetchDropdown = async (dropdownType, projectId = null, userId = null) => {
     try {
          const payload = { dropdown_type: dropdownType };
          if (projectId) payload.project_id = projectId;
          if (userId) payload.logged_in_user_id = userId;
          const response = await api.post("/dropdown/get", payload);
          const data = response.data?.data || [];
          console.log(`[dropdownService] Fetched ${dropdownType}:`, data);
          // Returns the data array or an empty array as a fallback
          return data;
     } catch (error) {
          console.error(`❌ Error fetching ${dropdownType}:`, error.response?.data || error.message);
          return [];
     }
};

/**
 * Executes concurrent API calls to retrieve all metadata required for user profiles.
 * Optimized with Promise.all for faster loading.
 * @param {number|null} userId - Logged in user ID (required for fetching agent dropdown).
 */
export const fetchUserDropdowns = async (userId = null) => {
     try {
          const [
               roles,
               designations,
               teams,
               projectManagers,
               assistantManagers,
               qas,
               agents,
               projectCategories,
          ] = await Promise.all([
               fetchDropdown("user roles"),
               fetchDropdown("designations"),
               fetchDropdown("teams"),
               fetchDropdown("project manager"),
               fetchDropdown("assistant manager"),
               fetchDropdown("qa"),
               fetchDropdown("agent", null, userId), // Pass userId for agent dropdown
               fetchDropdown("project categories"),
          ]);

          const result = {
               roles,
               designations,
               teams,
               projectManagers,
               assistantManagers,
               qas,
               agents,
               projectCategories,
          };

          return result;
     } catch (error) {
          console.error("❌ Error fetching user dropdowns:", error);
          return {
               roles: [],
               designations: [],
               teams: [],
               projectManagers: [],
               assistantManagers: [],
               qas: [],
               agents: [],
               projectCategories: [],
          };
     }
};