import { useState } from 'react';
import { Loader, Pencil } from 'lucide-react';
import '../styles/LogExpense.css';

interface LogExpenseProps {
  token: string | null;
  user: any;
  apiBase: string;
  labours: any[];
  transactions?: any[];
  onNavigate: (tab: 'dashboard' | 'log-expense' | 'request-advance' | 'history' | 'reminders' | 'tasks' | 'chat' | 'profile' | 'labourers') => void;
  onExpenseSubmitted: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function LogExpense({ 
  token, 
  user,
  apiBase, 
  labours = [],
  transactions = [],
  onNavigate, 
  onExpenseSubmitted, 
  showToast 
}: LogExpenseProps) {
  const [activeForm, setActiveForm] = useState<'inflow' | 'outflow'>('inflow');

  // Helper to parse description into details and reason
  const parseDescription = (description: string, category: string, txType: string) => {
    let details = '';
    let reason = '';

    const reasonMarker = '. Reason: ';
    const directReasonMarker = 'Reason: ';
    
    if (description.includes(reasonMarker)) {
      const parts = description.split(reasonMarker);
      details = parts[0];
      reason = parts.slice(1).join(reasonMarker);
    } else if (description.includes(directReasonMarker)) {
      const parts = description.split(directReasonMarker);
      details = parts[0];
      reason = parts.slice(1).join(directReasonMarker);
    } else {
      if (txType === 'received') {
        details = 'Cash Received from Bafnatoys';
      } else {
        details = category.replace('-', ' ').toUpperCase();
      }
      reason = description || '--';
    }

    if (details.endsWith('.')) {
      details = details.slice(0, -1);
    }

    return { details, reason };
  };

  // Helper to render details with styled status badges
  const renderDetailsCell = (detailsText: string) => {
    let text = detailsText;
    let badgeText = '';
    let badgeClass = '';

    if (detailsText.includes('(Auto-Approved)')) {
      text = detailsText.replace('(Auto-Approved)', '').trim();
      badgeText = 'Auto-Approved';
      badgeClass = 'badge-success';
    } else if (detailsText.includes('(Approved by Owner)')) {
      text = detailsText.replace('(Approved by Owner)', '').trim();
      badgeText = 'MD Approved';
      badgeClass = 'badge-info';
    } else if (detailsText.includes('(By Owner)')) {
      text = detailsText.replace('(By Owner)', '').trim();
      badgeText = 'Direct Advance';
      badgeClass = 'badge-warning';
    }

    text = text.replace(/\s+/g, ' ').trim();
    if (text.endsWith('.')) text = text.slice(0, -1);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600 }}>{text}</span>
        {badgeText && (
          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {badgeText}
          </span>
        )}
      </div>
    );
  };

  // Editing transaction states & handlers
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState<'handcash' | 'online'>('handcash');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const handleStartEdit = (tx: any) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditPaymentMode(tx.paymentMode || 'handcash');
    const d = new Date(tx.date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setEditDate(`${yyyy}-${mm}-${dd}`);
    setEditDescription(tx.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !token) return;
    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`${apiBase}/expenses/${editingTx._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          category: editingTx.txType === 'expense' ? editCategory : 'received',
          paymentMode: editPaymentMode,
          date: new Date(editDate),
          description: editDescription
        })
      });

      if (res.ok) {
        showToast('Transaction updated successfully!', 'success');
        setEditingTx(null);
        onExpenseSubmitted(); // Refresh dashboard data states
      } else {
        const errorData = await res.json();
        showToast(errorData.message || 'Failed to update transaction', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'danger');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

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

      <div className="log-expense-split-layout">
        <div className="log-expense-form-side">
          {/* Tabs Selector */}
          <div className="tab-container" style={{ marginBottom: '24px', width: '100%', maxWidth: '600px' }}>
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
            <div className="glass-panel log-expense-card" style={{ width: '100%', maxWidth: '600px' }}>
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
            <div className="glass-panel log-expense-card" style={{ width: '100%', maxWidth: '600px' }}>
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

        {/* Transaction History Column */}
        <div className="glass-panel log-expense-history-side">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Recent Logs</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Showing last 8 logged transactions.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                Total: {transactions.length}
              </span>
              <button 
                type="button"
                onClick={() => onNavigate('history')} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                👁️ View Full History
              </button>
            </div>
          </div>

          <div className="table-container" style={{ margin: '0 0 24px 0', border: '1px solid var(--glass-border)' }}>
            <table className="custom-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Date</th>
                  <th>Details</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((tx) => {
                  const { details, reason } = parseDescription(tx.description, tx.category, tx.txType);
                  return (
                    <tr key={tx._id}>
                      <td>{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {renderDetailsCell(details)}
                          {reason && reason !== '--' && (
                            <small style={{ color: 'var(--text-secondary)', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>
                              Reason: {reason}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          tx.txType === 'received' ? 'badge-success' : 'badge-info'
                        }`}>
                          {tx.txType === 'received' ? 'RECEIVED' : tx.category.replace('-', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 500 }}>
                          {tx.paymentMode === 'online' ? '🌐 Online' : '💵 Cash'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: tx.txType === 'received' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                        {tx.txType === 'received' ? '+' : '-'}₹{tx.amount}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tx)}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No recent cash transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* EDIT TRANSACTION MODAL */}
      {editingTx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel glass-panel-glow" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <h2 className="gradient-text" style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 700 }}>Edit Transaction</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Payment Mode</label>
                <select 
                  className="form-input"
                  value={editPaymentMode}
                  onChange={e => setEditPaymentMode(e.target.value as any)}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="handcash">💵 Cash (Handcash)</option>
                  <option value="online">🌐 Online (Bank / UPI)</option>
                </select>
              </div>

              {editingTx.txType === 'expense' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                  <select 
                    className="form-input"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="staff-welfare">Staff Welfare</option>
                    <option value="petrol">Petrol / Vehicle Fuel</option>
                    <option value="porter-vehicle">Porter / Vehicle Transport</option>
                    <option value="sir-expenses">Sir Expenses</option>
                    <option value="salary-advance">Salary Advance (Self/Direct)</option>
                    <option value="company-expenses">Company Expenses</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Amount (₹)</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-input" 
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Description / Remarks</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={isSubmittingEdit}>
                  {isSubmittingEdit ? <Loader className="spinner" size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditingTx(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
