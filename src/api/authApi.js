import { apiCall, setAuthToken, clearAuth, SESSION_KEY } from './config.js';

const saveSession = (userData) => {
  const session = {
    _id: userData._id,
    email: userData.email,
    name: userData.name,
    theme: userData.theme || 'light',
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const googleSignIn = async (firebaseUserOrToken) => {
  try {
    console.log('🔐 Processing Google Sign-In...');

    let payload;

    if (typeof firebaseUserOrToken === 'string') {
      payload = { firebaseToken: firebaseUserOrToken };
    } else if (firebaseUserOrToken?.idToken) {
      payload = { firebaseToken: firebaseUserOrToken.idToken };
    } else {
      throw new Error('No valid Firebase token found');
    }

    console.log('🔄 Sending to backend...');

    const data = await apiCall('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.success && data.token && data.data) {
      setAuthToken(data.token);
      saveSession(data.data);
      console.log('✅ Google Sign-In successful');
    } else {
      throw new Error(data.message || 'Google auth failed');
    }

    return data;
  } catch (error) {
    console.error('❌ Google Sign-In error:', error.message);
    throw error;
  }
};