// frontend/src/api/config.js
// ✅ FIXED - Token always checked from localStorage

const BASE_URL = 'http://localhost:5000/api';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  console.log('✅ Auth token set in memory');
};

export const clearAuth = () => {
  authToken = null;
  console.log('✅ Auth token cleared from memory');
};

export const SESSION_KEY = 'expense_session';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  // ✅ ALWAYS check localStorage first, then fallback to authToken variable
  const token = localStorage.getItem('et_auth_token') || authToken;

  console.log('\n📡 API Request:');
  console.log(`   ${options.method || 'GET'} ${endpoint}`);
  console.log(`   Full URL: ${url}`);
  
  if (token) {
    console.log(`   🔐 Token found: ${token.substring(0, 20)}...`);
  } else {
    console.log(`   ❌ NO TOKEN FOUND!`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // ✅ ALWAYS include token if it exists
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
    });

    const data = await res.json();

    console.log(`   📊 Status: ${res.status}`);

    if (!res.ok) {
      console.error(`   ❌ Error [${res.status}]:`, data.message);
      throw new Error(data.message || 'API Error');
    }

    console.log(`   ✅ Success`);
    return data;
  } catch (error) {
    console.error('❌ API Call Failed:', error.message);
    throw error;
  }
};