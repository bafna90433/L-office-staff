import { useState } from 'react';
import { Loader } from 'lucide-react';
import '../styles/LogExpense.css';

interface LogExpenseProps {
  token: string | null;
  user: any;
  apiBase: string;
  labours: any[];
  onNavigate: (tab: 'dashboard' | 'log-expense' | 'request-advance' | 'history' | 'reminders' | 'tasks' | 'chat' | 'profile' | 'labourers') => void;
  onExpenseSubmitted: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function LogExpense({ 
  token, 
  user,
  apiBase, 
  labours = [],
  onNavigate, 
  onExpenseSubmitted, 
  showToast 
}: LogExpenseProps) {
  const [activeForm, setActiveForm] = useState<'inflow' | 'outflow'>('inflow');

  // Cash Received (Inflow) form states
  const [rcvAmount, setRcvAmount] = useState('');
  const [rcvPaymentMode, setRcvPaymentMode] = useState<'handcash' | 'online'>('handcash');
  const [rcvDesc, setRcvDesc] = useState('');
  const [rcvSubmitting, setRcvSubmitting] = useState(false);

  // Petty Cash Expense (Outflow) form states
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('staff-welfare');
  const [expCustomCategory, setExpCustomCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expPaymentMode, setExpPaymentMode] = useState<'handcash' | 'online'>('handcash');
  const [expLabourId, setExpLabourId] = useState('');
  const [expSubmitting, setExpSubmitting] = useState(false);

  const handleLogReceivedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcvAmount) return;

    setRcvSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/expenses/cash-received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(rcvAmount),
          date: new Date(),
          description: rcvDesc.trim() || 'Cash received from owner',
          paymentMode: rcvPaymentMode,
          staffId: user?.id || user?._id || ''
        })
      });

      if (res.ok) {
        setRcvAmount('');
        setRcvDesc('');
        setRcvPaymentMode('handcash');
        showToast('Cash received logged successfully!', 'success');
        onExpenseSubmitted();
        onNavigate('dashboard');
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to log cash received', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'danger');
    } finally {
      setRcvSubmitting(false);
    }
  };

  const handleLogExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount) return;

    if (expCategory === 'salary-advance' && !expLabourId) {
      showToast('Please select a labourer for salary advance', 'warning');
      return;
    }

    setExpSubmitting(true);
    try {
      let finalCategory = expCategory;
      let finalDescription = expDesc.trim();
      
      if (expCategory === 'custom') {
        finalCategory = 'miscellaneous';
        const prefix = expCustomCategory.trim() ? `[Category: ${expCustomCategory.trim()}] ` : '[Custom Category] ';
        finalDescription = prefix + finalDescription;
      }

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
          description: finalDescription,
          paymentMode: expPaymentMode,
          labourId: expLabourId || null,
          staffId: user?.id || user?._id || ''
        })
      });

      if (res.ok) {
        setExpAmount('');
        setExpDesc('');
        setExpCategory('staff-welfare');
        setExpCustomCategory('');
        setExpPaymentMode('handcash');
        setExpLabourId('');
        showToast('Petty cash expense logged successfully!', 'success');
        onExpenseSubmitted();
        onNavigate('dashboard');
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to log expense', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'danger');
    } finally {
      setExpSubmitting(false);
    }
  };

  return (
    <div className="log-expense-container animate-fade-in">
      <div className="log-expense-title-section">
        <h1 className="log-expense-title">Record Cash & Expenses</h1>
        <p className="log-expense-subtitle">Log daily cash inflow received from owner or outflow spent on operations.</p>
      </div>

      {/* Tabs Selector */}
      <div className="tab-container" style={{ marginBottom: '24px' }}>
        <button 
          className={`tab-button ${activeForm === 'inflow' ? 'active' : ''}`}
          onClick={() => setActiveForm('inflow')}
        >
          💵 Cash Received (Inflow)
        </button>
        <button 
          className={`tab-button ${activeForm === 'outflow' ? 'active' : ''}`}
          onClick={() => setActiveForm('outflow')}
        >
          💸 Record Expense (Outflow)
        </button>
      </div>

      {activeForm === 'inflow' ? (
        /* Form: Cash Received from Bafnatoys */
        <div className="glass-panel log-expense-card">
          <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 700 }}>Record Cash Received from Bafnatoys</h3>
          <form onSubmit={handleLogReceivedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select 
                className="form-input"
                value={rcvPaymentMode}
                onChange={e => setRcvPaymentMode(e.target.value as any)}
                required
              >
                <option value="handcash">💵 Cash (Handcash)</option>
                <option value="online">🌐 Online (Bank / UPI)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount Received (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Enter amount (e.g. 10000)"
                value={rcvAmount}
                onChange={e => setRcvAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 10000 cash given by Bafnatoys in office, 10000 online UPI from Bafnatoys"
                value={rcvDesc}
                onChange={e => setRcvDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={rcvSubmitting}>
                {rcvSubmitting ? <Loader className="spinner" size={16} /> : 'Record Cash Received'}
              </button>
              <button type="button" onClick={() => onNavigate('dashboard')} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Form: Record Petty Cash Expense (Outflow) */
        <div className="glass-panel log-expense-card">
          <h3 style={{ marginBottom: '4px', fontSize: '1.25rem', fontWeight: 700 }}>Record Petty Cash Expense</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Deduct cash from balance by recording an official transaction.</p>
          
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
                <option value="company-expenses">Company Expenses</option>
                <option value="miscellaneous">Miscellaneous</option>
                <option value="custom">Custom (Type your own)</option>
              </select>
            </div>

            {expCategory === 'custom' && (
              <div className="form-group">
                <label className="form-label">Custom Category Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter custom category (e.g. Tea & Snacks)"
                  value={expCustomCategory}
                  onChange={e => setExpCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Enter amount (e.g. 500)"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 50kg rice for worker kitchen, petrol for Trinath bike"
                value={expDesc}
                onChange={e => setExpDesc(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select 
                className="form-input"
                value={expPaymentMode}
                onChange={e => setExpPaymentMode(e.target.value as any)}
                required
              >
                <option value="handcash">💵 Cash (Handcash)</option>
                <option value="online">🌐 Online (Bank / UPI)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Tag Labourer {expCategory === 'salary-advance' ? '(Required)' : '(Optional)'}
              </label>
              <select 
                className="form-input"
                value={expLabourId}
                onChange={e => setExpLabourId(e.target.value)}
                required={expCategory === 'salary-advance'}
              >
                <option value="">-- Select Employee (Optional) --</option>
                {labours.map((l: any) => (
                  <option key={l._id} value={l._id}>{l.name} {l.empCode ? `(ID: ${l.empCode})` : ''}</option>
                ))}
              </select>
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
      )}
    </div>
  );
}
