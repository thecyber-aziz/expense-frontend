import { apiCall } from './config.js';

// Get all expenses with filters
export const getExpenses = async (month = null, year = null, category = null) => {
  let query = '';
  const params = new URLSearchParams();

  if (month && year) {
    params.append('month', month);
    params.append('year', year);
  }

  if (category) {
    params.append('category', category);
  }

  if (params.toString()) {
    query = `?${params.toString()}`;
  }

  return apiCall(`/expenses${query}`, {
    method: 'GET',
  });
};

// Get a single expense by ID
export const getExpenseById = async (id) => {
  return apiCall(`/expenses/${id}`, {
    method: 'GET',
  });
};

// Create a new expense
export const createExpense = async (expenseData) => {
  return apiCall('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });
};

// Update an expense
export const updateExpense = async (id, expenseData) => {
  return apiCall(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  });
};

// Delete an expense
export const deleteExpense = async (id) => {
  return apiCall(`/expenses/${id}`, {
    method: 'DELETE',
  });
};

// Get expense statistics
export const getExpenseStats = async (month = null, year = null) => {
  let query = '';
  const params = new URLSearchParams();

  if (month && year) {
    params.append('month', month);
    params.append('year', year);
  }

  if (params.toString()) {
    query = `?${params.toString()}`;
  }

  return apiCall(`/expenses/stats/summary${query}`, {
    method: 'GET',
  });
};
