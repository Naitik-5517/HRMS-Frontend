import api from "./api";
import { log, logError } from "../config/environment";

export const loginUser = async (username, password, deviceId, deviceType) => {
  try {
    log('[authService] Attempting login for:', username);
    const response = await api.post("/auth/user", {
      user_email: username,
      user_password: password,
      device_id: deviceId,
      device_type: deviceType
    });
    log('[authService] Login successful');
    return response.data;
  } catch (error) {
    logError('[authService] Login failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

// Add this function for creating a new user
export const addUser = async (userData) => {
  try {
    log('[authService] Creating new user');
    const response = await api.post("/auth/user", userData);
    log('[authService] User created successfully');
    return response.data;
  } catch (error) {
    logError('[authService] Failed to create user:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create user');
  }
};

export const fetchUsersByRole = async (role) => {
  try {
    log('[authService] Fetching users by role:', role);
    const response = await api.post("/user/list", { role });
    return response.data;
  } catch (error) {
    logError('[authService] Failed to fetch users by role:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch users');
  }
};

// Fetch all users without role filter (for Manage → Users)
export const fetchUsersList = async (userId, deviceId, deviceType) => {
  try {
    log('[authService] Fetching users list');
    const payload = {
      user_id: userId,
      device_id: deviceId,
      device_type: deviceType
    };
    const response = await api.post("/user/list", payload);
    log('[authService] Users list fetched successfully');
    return response.data;
  } catch (error) {
    logError('[authService] Failed to fetch users list:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch users');
  }
};

export const updateUser = async (userData) => {
  try {
    log('[authService] Updating user:', userData.user_id);
    const response = await api.put('/user/update_user', userData);
    log('[authService] User updated successfully');
    return response.data;
  } catch (error) {
    logError('[authService] Failed to update user:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};

export const deleteUser = async (user_id, audit = {}) => {
  try {
    log('[authService] Deleting user:', user_id);
    const payload = { user_id, ...audit };
    const response = await api.put("/user/delete_user", payload);
    log('[authService] User deleted successfully');
    return response;
  } catch (error) {
    logError('[authService] Failed to delete user:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to delete user');
  }
};

