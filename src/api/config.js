// frontend/src/api/config.js

const BASE_URL = 'https://expense-backend-tj7z.onrender.com/api'; // ✅ FIXED

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const clearAuth = () => {
  authToken = null;
};

export const SESSION_KEY = 'expense_session';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  console.log('\n📡 API Request:');
  console.log(`   ${options.method || 'GET'} ${endpoint}`);
  console.log(`   Full URL: ${url}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...(options.headers || {}),
      },
    });

    const data = await res.json();

    console.log(`   📊 Status: ${res.status}`);

    if (!res.ok) {
      console.error(`   ❌ Error [${res.status}]:`, data.message);
      throw new Error(data.message || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('❌ API Call Failed:', error.message);
    throw error;
  }
};