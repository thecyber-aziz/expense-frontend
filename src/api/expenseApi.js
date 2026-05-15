// frontend/src/api/expenseApi.js
// ✅ FIXED - Expense API with proper error handling and logging

import { apiCall } from './config.js';

/**
 * Get all expenses with filters (including tab-specific)
 */
export const getExpenses = async (tabId = null, month = null, year = null, category = null) => {
  const params = new URLSearchParams();

  if (tabId) {
    params.append('tabId', tabId);
  }

  if (month && year) {
    params.append('month', month);
    params.append('year', year);
  }

  if (category) {
    params.append('category', category);
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    console.log(`📥 Fetching expenses for tab: ${tabId}`);
    const response = await apiCall(`/expenses${query}`, {
      method: 'GET',
    });
    console.log(`✅ Expenses fetched: ${response.data?.length || 0} items`);
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch expenses:', error);
    throw error;
  }
};

/**
 * Get a single expense by ID
 */
export const getExpenseById = async (id) => {
  try {
    console.log(`📥 Fetching expense: ${id}`);
    const response = await apiCall(`/expenses/${id}`, {
      method: 'GET',
    });
    console.log(`✅ Expense fetched`);
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch expense:', error);
    throw error;
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (expenseData) => {
  try {
    console.log('💾 Creating expense:', expenseData.name);
    const response = await apiCall('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    console.log('✅ Expense created successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to create expense:', error);
    throw error;
  }
};

/**
 * Update an expense
 */
export const updateExpense = async (id, expenseData) => {
  try {
    console.log(`✏️ Updating expense: ${id}`);
    const response = await apiCall(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
    console.log('✅ Expense updated successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to update expense:', error);
    throw error;
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (id) => {
  try {
    console.log(`🗑️ Deleting expense: ${id}`);
    const response = await apiCall(`/expenses/${id}`, {
      method: 'DELETE',
    });
    console.log('✅ Expense deleted successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to delete expense:', error);
    throw error;
  }
};

/**
 * Get expense statistics (with optional tab filter)
 */
export const getExpenseStats = async (tabId = null, month = null, year = null) => {
  const params = new URLSearchParams();

  if (tabId) {
    params.append('tabId', tabId);
  }

  if (month && year) {
    params.append('month', month);
    params.append('year', year);
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    console.log(`📊 Fetching expense stats for tab: ${tabId}`);
    const response = await apiCall(`/expenses/stats/summary${query}`, {
      method: 'GET',
    });
    console.log('✅ Expense stats fetched');
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch expense stats:', error);
    throw error;
  }
};