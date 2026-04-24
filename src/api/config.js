/**
 * ✅ WORKING API CONFIGURATION
 * Token authentication with proper error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Configuration loaded');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   Mode: ${import.meta.env.VITE_API_URL ? '🔧 CUSTOM' : '⚙️  DEFAULT'}`);

// Token Storage Keys
const TOKEN_KEY = 'authToken';
const SESSION_KEY = 'et_session';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token || null;
};

/**
 * Set auth token in localStorage
 */
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Auth token saved');
  } else {
    localStorage.removeItem(TOKEN_KEY);
    console.log('✅ Auth token cleared');
  }
};

/**
 * Clear all auth data
 */
const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  console.log('✅ All auth data cleared');
};

/**
 * ✅ MAIN API CALL FUNCTION
 * Makes HTTP requests with automatic token injection
 */
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  const token = getAuthToken();

  console.log(`\n📡 API Request:`);
  console.log(`   ${method} ${endpoint}`);
  console.log(`   Full URL: ${url}`);

  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };

  // Add Bearer token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log(`   🔐 Token: Present (${token.substring(0, 20)}...)`);
  } else {
    console.log(`   🔐 Token: Not available`);
  }

  try {
    console.log(`   ⏳ Sending...`);

    const response = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'include',
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    console.log(`   📊 Status: ${response.status} ${response.statusText}`);

    // Parse response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error(`Invalid JSON response: ${response.statusText}`);
    }

    // Handle authentication errors
    if (response.status === 401) {
      console.warn(`   ⚠️  Unauthorized (401)`);
      clearAuth();
      window.location.href = '/';
      throw new Error(data.message || 'Unauthorized');
    }

    // Handle other errors
    if (!response.ok) {
      console.error(`   ❌ Error [${response.status}]: ${data.message}`);
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }

    console.log(`   ✅ Success`);
    return data;
  } catch (error) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      console.error(`   ❌ Request timeout (10 seconds)`);
      throw new Error('Request timeout - backend not responding');
    } else if (error instanceof TypeError) {
      console.error(`   ❌ Network error: ${error.message}`);
      throw new Error(`Network error: ${error.message}. Is the backend running on ${API_BASE_URL}?`);
    } else {
      console.error(`   ❌ Error: ${error.message}`);
      throw error;
    }
  }
};

export { 
  apiCall, 
  getAuthToken, 
  setAuthToken, 
  clearAuth, 
  API_BASE_URL,
  TOKEN_KEY,
  SESSION_KEY,
};
