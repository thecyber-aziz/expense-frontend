/**
 * ✅ COMPLETE WORKING FRONTEND API
 * All authentication and user management functions
 * File: src/api/authApi.js
 */

import { apiCall, setAuthToken, clearAuth, SESSION_KEY } from './config.js';

console.log('📚 Auth API module loaded');

/**
 * Save user session to localStorage
 */
const saveSession = (userData) => {
  const session = {
    _id: userData._id,
    email: userData.email,
    name: userData.name,
    theme: userData.theme || 'light',
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
      setAuthToken(data.token);
      saveSession(data.data);
      console.log('✅ Registration successful');
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
      setAuthToken(data.token);
      saveSession(data.data);
      console.log('✅ Login successful');
    }

    return data;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
};

/**
 * ✅ COMPLETE WORKING GOOGLE SIGN-IN FUNCTION
 * This handles Google authentication with proper error handling
 */
export const googleSignIn = async (firebaseUserOrToken) => {
  try {
    console.log('🔐 Processing Google Sign-In...');

    // Build payload
    let payload;
    
    if (typeof firebaseUserOrToken === 'string') {
      // Token string
      payload = { firebaseToken: firebaseUserOrToken };
      console.log('📋 Using token string');
    } else if (firebaseUserOrToken?.idToken) {
      // User object with idToken
      payload = { firebaseToken: firebaseUserOrToken.idToken };
      console.log('📋 Using user object token');
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
      setAuthToken(data.token);
      saveSession(data.data);
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
  return session && session.email ? true : false;
};

/**
 * Get current user from session (no API call)
 */
export const getCurrentUserFromSession = () => {
  return getSession();
};

console.log('✅ Auth API ready');