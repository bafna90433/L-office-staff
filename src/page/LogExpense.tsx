import { useState } from 'react';
import { Loader } from 'lucide-react';
import '../styles/LogExpense.css';

interface LogExpenseProps {
  token: string | null;
  apiBase: string;
  onNavigate: (tab: 'dashboard' | 'log-expense' | 'request-advance' | 'history' | 'reminders' | 'tasks' | 'chat') => void;
  onExpenseSubmitted: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function LogExpense({ 
  token, 
  apiBase, 
  onNavigate, 
  onExpenseSubmitted, 
  showToast 
}: LogExpenseProps) {
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('staff-welfare');
  const [customCategory, setCustomCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expSubmitting, setExpSubmitting] = useState(false);

  const handleLogExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expCategory) return;
    
    const finalCategory = expCategory === 'custom' ? customCategory : expCategory;
    if (expCategory === 'custom' && !finalCategory.trim()) {
      showToast('Please enter a custom category name', 'warning');
      return;
    }
    
    setExpSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/expenses/log`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(expAmount),
          date: new Date(),
          category: finalCategory,
          description: expDesc
        })
      });

      if (res.ok) {
        setExpAmount('');
        setExpDesc('');
        setCustomCategory('');
        showToast('Expense logged successfully!', 'success');
        onExpenseSubmitted();
        onNavigate('dashboard');
      } else {
        showToast('Failed to log expense', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'danger');
    } finally {
      setExpSubmitting(false);
    }
  };

  return (
    <div className="log-expense-container">
      <div className="log-expense-title-section">
        <h1 className="log-expense-title">Record Petty Cash Expense</h1>
        <p className="log-expense-subtitle">Deduct cash from balance by recording an official transaction.</p>
      </div>

      <div className="glass-panel log-expense-card">
        <form onSubmit={handleLogExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Expense Category</label>
            <select 
              className="form-input"
              value={expCategory}
              onChange={e => setExpCategory(e.target.value)}
              required
            >
              <option value="staff-welfare">Staff Welfare</option>
              <option value="petrol">Petrol / Vehicle Fuel</option>
              <option value="porter-vehicle">Porter / Vehicle Transport</option>
              <option value="sir-expenses">Sir Expenses</option>
              <option value="salary-advance">Salary Advance (Self/Direct)</option>
              <option value="miscellaneous">Miscellaneous</option>
              <option value="custom">Custom (Type your own)</option>
            </select>
          </div>

          {expCategory === 'custom' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Custom Category Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter your custom category"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Amount Spent (₹)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Enter amount"
              value={expAmount}
              onChange={e => setExpAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Purpose</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 50kg rice for worker kitchen, petrol for Trinath bike"
              value={expDesc}
              onChange={e => setExpDesc(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={expSubmitting}>
              {expSubmitting ? <Loader className="spinner" size={16} /> : 'Record Transaction'}
            </button>
            <button type="button" onClick={() => onNavigate('dashboard')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
