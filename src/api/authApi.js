// frontend/src/api/authApi.js
// ✅ FIXED - Complete authentication API with proper token handling

import { apiCall, setAuthToken, clearAuth, SESSION_KEY } from './config.js';

console.log('📚 Auth API module loaded');

const TOKEN_KEY = "et_auth_token";

/**
 * Save user session to localStorage
 */
const saveSession = (userData, token) => {
  const session = {
    _id: userData._id,
    email: userData.email,
    name: userData.name,
    theme: userData.theme || 'light',
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Token saved to localStorage');
  }
  console.log('✅ Session saved to localStorage');
};

/**
 * Get user session from localStorage
 */
export const getSession = () => {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('❌ Error parsing session:', error);
    return null;
  }
};

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || null;
    return token;
  } catch (error) {
    console.error('❌ Error retrieving token:', error);
    return null;
  }
};

/**
 * Register user with email and password
 */
export const registerUser = async (name, email, password) => {
  try {
    console.log('📝 Registering user:', email);
    
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (data.success && data.token && data.data) {
      // ✅ CRITICAL - Set token in memory AND localStorage
      setAuthToken(data.token);
      saveSession(data.data, data.token);
      console.log('✅ Registration successful');
    } else {
      console.error('❌ Registration response invalid:', data);
    }

    return data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (email, password) => {
  try {
    console.log('🔓 Logging in user:', email);
    
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.token && data.data) {
      // ✅ CRITICAL - Set token in memory AND localStorage
      setAuthToken(data.token);
      saveSession(data.data, data.token);
      console.log('✅ Login successful, token set');
    } else {
      console.error('❌ Login response invalid:', data);
    }

    return data;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
};

/**
 * Google Sign-In with Firebase token
 */
export const googleSignIn = async (firebaseUserData) => {
  try {
    console.log('🔐 Processing Google Sign-In...');

    // Build payload
    let payload;
    
    if (typeof firebaseUserData === 'string') {
      // Token string
      payload = { firebaseToken: firebaseUserData };
      console.log('📋 Using token string');
    } else if (firebaseUserData?.idToken) {
      // User object with idToken
      payload = { firebaseToken: firebaseUserData.idToken };
      console.log('📋 Using user object with idToken');
    } else {
      throw new Error('No valid Firebase token found');
    }

    // Validate token exists
    if (!payload.firebaseToken) {
      throw new Error('Firebase token is missing');
    }

    console.log('🔄 Sending to backend: POST /api/auth/google');
    
    // Call backend
    const data = await apiCall('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log('📊 Backend response:', data.success ? '✅ Success' : '❌ Failed');

    // Handle response
    if (data.success && data.token && data.data) {
      // ✅ CRITICAL - Set token in memory AND localStorage
      setAuthToken(data.token);
      saveSession(data.data, data.token);
      console.log('✅ Google Sign-In successful:', data.data.email);
    } else {
      console.error('❌ Backend returned error:', data.message);
      throw new Error(data.message || 'Google authentication failed');
    }

    return data;
  } catch (error) {
    console.error('❌ Google Sign-In error:', error.message);
    throw error;
  }
};

/**
 * Get current user info from backend
 */
export const getCurrentUser = async () => {
  try {
    console.log('👤 Fetching current user...');
    
    const response = await apiCall('/auth/me', {
      method: 'GET',
    });

    console.log('✅ User info retrieved:', response.data?.email);
    return response;
  } catch (error) {
    console.error('❌ Failed to get current user:', error.message);
    throw error;
  }
};

/**
 * Update user theme
 */
export const updateUserTheme = async (theme) => {
  try {
    console.log('🎨 Updating theme to:', theme);
    
    const data = await apiCall('/auth/theme', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    });
    
    // Update local session with new theme
    const session = getSession();
    if (session) {
      session.theme = theme;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    
    console.log('✅ Theme updated');
    return data;
  } catch (error) {
    console.error('❌ Failed to update theme:', error.message);
    throw error;
  }
};

/**
 * Update user notifications
 */
export const updateUserNotifications = async (expenseAlerts, weeklySummary, budgetWarnings) => {
  try {
    console.log('🔔 Updating notifications...');
    
    const data = await apiCall('/auth/notifications', {
      method: 'PUT',
      body: JSON.stringify({ expenseAlerts, weeklySummary, budgetWarnings }),
    });
    
    console.log('✅ Notifications updated');
    return data;
  } catch (error) {
    console.error('❌ Failed to update notifications:', error.message);
    throw error;
  }
};

/**
 * Change user password
 */
export const changeUserPassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    console.log('🔐 Changing password...');
    
    const data = await apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    
    console.log('✅ Password changed successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to change password:', error.message);
    throw error;
  }
};

/**
 * Update app lock settings
 */
export const updateAppLockSettings = async (enabled, pin) => {
  try {
    console.log('🔒 Updating app lock...');
    
    const data = await apiCall('/auth/app-lock', {
      method: 'PUT',
      body: JSON.stringify({ enabled, pin }),
    });
    
    console.log('✅ App lock updated');
    return data;
  } catch (error) {
    console.error('❌ Failed to update app lock:', error.message);
    throw error;
  }
};

/**
 * Update 2FA settings
 */
export const update2FASettings = async (enabled) => {
  try {
    console.log('🔐 Updating 2FA...');
    
    const data = await apiCall('/auth/2fa', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
    
    console.log('✅ 2FA settings updated');
    return data;
  } catch (error) {
    console.error('❌ Failed to update 2FA:', error.message);
    throw error;
  }
};

/**
 * Logout user
 */
export const logoutUser = () => {
  try {
    clearAuth();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('❌ Logout error:', error.message);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const session = getSession();
  const token = getAuthToken();
  return session && session.email && token ? true : false;
};

/**
 * Get current user from session (no API call)
 */
export const getCurrentUserFromSession = () => {
  return getSession();
};

console.log('✅ Auth API ready');