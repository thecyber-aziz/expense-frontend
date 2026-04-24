# Environment Configuration

Create a `.env.local` file in the frontend directory with:

```
VITE_API_URL=http://localhost:5000/api
```

Or use the default configuration that points to `http://localhost:5000/api`.

## Using API Services in Your Components

### 1. **Authentication Service**

```javascript
import authService from './services/authService.js';

// Register
const registerResult = await authService.register('John Doe', 'john@example.com', 'password123');
if (registerResult.success) {
  console.log('User registered:', registerResult.data);
}

// Login
const loginResult = await authService.login('john@example.com', 'password123');
if (loginResult.success) {
  console.log('User logged in:', loginResult.data);
}

// Get current user
const userResult = await authService.getUser();
if (userResult.success) {
  console.log('Current user:', userResult.data);
}

// Check if authenticated
if (authService.isAuthenticated()) {
  console.log('User is logged in');
}

// Update theme
const themeResult = await authService.updateTheme('dark');
if (themeResult.success) {
  console.log('Theme updated:', themeResult.data);
}

// Logout
authService.logout();
```

### 2. **Expense Service**

```javascript
import expenseService from './services/expenseService.js';

// Get all expenses
const expenses = await expenseService.fetchExpenses();
if (expenses.success) {
  console.log('Expenses:', expenses.data);
}

// Get expenses by month/year
const monthlyExpenses = await expenseService.fetchExpenses(4, 2026);
if (monthlyExpenses.success) {
  console.log('April 2026 expenses:', monthlyExpenses.data);
}

// Get expenses by category
const foodExpenses = await expenseService.fetchExpenses(null, null, 'food');
if (foodExpenses.success) {
  console.log('Food expenses:', foodExpenses.data);
}

// Get single expense
const expense = await expenseService.fetchExpenseById('expenseId');
if (expense.success) {
  console.log('Expense:', expense.data);
}

// Create new expense
const newExpense = await expenseService.addExpense({
  description: 'Coffee',
  amount: 5.50,
  category: 'food',
  date: new Date(),
  notes: 'Morning coffee'
});
if (newExpense.success) {
  console.log('Expense created:', newExpense.data);
}

// Update expense
const updated = await expenseService.editExpense('expenseId', {
  description: 'Lunch',
  amount: 12.00,
  category: 'food'
});
if (updated.success) {
  console.log('Expense updated:', updated.data);
}

// Delete expense
const deleted = await expenseService.removeExpense('expenseId');
if (deleted.success) {
  console.log('Expense deleted');
}

// Get expense statistics
const stats = await expenseService.fetchStats(4, 2026);
if (stats.success) {
  console.log('Stats:', stats.stats);
  console.log('Total amount:', stats.totalAmount);
}
```

### 3. **Using in React Components**

#### Example: Login Component
```jsx
import { useState } from 'react';
import authService from '../../services/authService.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.login(email, password);
    
    if (result.success) {
      // Navigate to dashboard or home
      console.log('Login successful!');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </form>
  );
}
```

#### Example: Expense List Component
```jsx
import { useState, useEffect } from 'react';
import expenseService from '../../services/expenseService.js';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const result = await expenseService.fetchExpenses();
    
    if (result.success) {
      setExpenses(result.data);
    } else {
      console.error('Error loading expenses:', result.error);
    }
    
    setLoading(false);
  };

  const deleteExpense = async (id) => {
    const result = await expenseService.removeExpense(id);
    if (result.success) {
      fetchExpenses(); // Refresh list
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {expenses.map(expense => (
        <div key={expense._id}>
          <h3>{expense.description}</h3>
          <p>Amount: ${expense.amount}</p>
          <p>Category: {expense.category}</p>
          <button onClick={() => deleteExpense(expense._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## File Structure

```
frontend/src/
├── api/
│   ├── config.js       - API base URL and helper functions
│   ├── authApi.js      - Authentication endpoints
│   ├── expenseApi.js   - Expense endpoints
│   └── index.js        - Combined exports
├── services/
│   ├── authService.js  - Authentication service wrapper
│   └── expenseService.js - Expense service wrapper
└── ...rest of your React app
```

## Notes

- All API calls automatically include the JWT token in headers
- Token is stored in localStorage after login
- All API functions return `{ success: boolean, data: ..., error: ... }`
- Replace `localhost:5000` in `.env.local` if your backend is hosted elsewhere
