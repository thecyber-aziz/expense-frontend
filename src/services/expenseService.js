import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
} from '../api/expenseApi.js';

// Expense Service
class ExpenseService {
  async fetchExpenses(month = null, year = null, category = null) {
    try {
      const response = await getExpenses(month, year, category);
      return { success: true, data: response.data, count: response.count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchExpenseById(id) {
    try {
      const response = await getExpenseById(id);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addExpense(expenseData) {
    try {
      const response = await createExpense(expenseData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async editExpense(id, expenseData) {
    try {
      const response = await updateExpense(id, expenseData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeExpense(id) {
    try {
      const response = await deleteExpense(id);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchStats(month = null, year = null) {
    try {
      const response = await getExpenseStats(month, year);
      return { success: true, data: response.data, stats: response.data.stats, totalAmount: response.data.totalAmount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ExpenseService();
