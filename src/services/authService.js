import { registerUser, loginUser, getCurrentUser, logoutUser, updateUserTheme } from '../api/authApi.js';
import { getAuthToken, setAuthToken } from '../api/config.js';

// Auth Service using localStorage
class AuthService {
  async register(name, email, password) {
    try {
      const response = await registerUser(name, email, password);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    try {
      const response = await loginUser(email, password);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUser() {
    try {
      const response = await getCurrentUser();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  logout() {
    logoutUser();
    return { success: true };
  }

  async updateTheme(theme) {
    try {
      const response = await updateUserTheme(theme);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isAuthenticated() {
    return !!getAuthToken();
  }

  getToken() {
    return getAuthToken();
  }
}

export default new AuthService();
