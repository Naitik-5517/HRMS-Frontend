import api from "./api";

/**
 * Fetches dropdown options from the API
 * @param {string} dropdownType - Type of dropdown to fetch
 * @param {number} userId - Logged in user ID
 * @param {number} projectId - Optional project ID filter
 * @param {number} teamId - Optional team ID filter
 */
export const fetchDropdownOptions = async (dropdownType, userId = null, projectId = null, teamId = null) => {
  console.log(`[dropdownApi] fetchDropdownOptions called with:`, {
    dropdownType,
    userId,
    projectId,
    teamId
  });
  
  const payload = { dropdown_type: dropdownType };
  
  // Add logged_in_user_id if provided
  if (userId) payload.logged_in_user_id = userId;
  
  // Add optional filters
  if (projectId) payload.project_id = projectId;
  if (teamId) payload.team_id = teamId;
  
  console.log(`[dropdownApi] Request payload:`, payload);
  
  try {
    const response = await api.post("dropdown/get", payload);
    console.log(`[dropdownApi] Response for ${dropdownType}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[dropdownApi] ❌ Error fetching ${dropdownType}:`, error);
    throw error;
  }
};
