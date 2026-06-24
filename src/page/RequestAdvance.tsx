import { useState, useEffect } from 'react';
import { Loader, Pencil } from 'lucide-react';
import '../styles/RequestAdvance.css';

interface Labour {
  _id: string;
  name: string;
  whatsapp: string;
  monthlySalary: number;
  workingHours?: number;
  shiftStart?: string;
  shiftEnd?: string;
  gender?: string;
  imageUrl: string;
  status: string;
  employeeType?: 'labourer' | 'staff';
  department?: string;
  phonePeNumber?: string;
  upiId?: string;
  phonePeQrUrl?: string;
  empCode?: string;
}

interface RequestAdvanceProps {
  token: string | null;
  apiBase: string;
  labours: Labour[];
  transactions?: any[];
  onNavigate: (tab: 'dashboard' | 'log-expense' | 'request-advance' | 'history' | 'reminders' | 'tasks' | 'chat' | 'profile' | 'labourers') => void;
  onAdvanceSubmitted: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function RequestAdvance({ 
  token, 
  apiBase, 
  labours, 
  transactions = [],
  onNavigate, 
  onAdvanceSubmitted, 
  showToast 
}: RequestAdvanceProps) {
  const [selectedLabourId, setSelectedLabourId] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advReason, setAdvReason] = useState('');
  const [advSubmitting, setAdvSubmitting] = useState(false);
  const [autoApproveLimit, setAutoApproveLimit] = useState(5000);

  const filteredTransactions = transactions.filter(
    tx => tx.txType === 'received' || tx.category === 'salary-advance'
  );

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
        onAdvanceSubmitted(); // Refresh dashboard/history data states
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

  // Fetch limit
  useEffect(() => {
    if (token) {
      fetch(`${apiBase}/settings/advance_auto_approval_limit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.value !== undefined) {
          setAutoApproveLimit(Number(data.value));
        }
      })
      .catch(err => console.error('Error fetching limit', err));
    }
  }, [token, apiBase]);

  // Sort labours to put "Company Expenses" at the top, followed by others alphabetically
  const sortedLabours = [...labours].sort((a, b) => {
    const aIsCompany = a.empCode === 'COMPANY' || a.name === 'Company Expenses';
    const bIsCompany = b.empCode === 'COMPANY' || b.name === 'Company Expenses';
    if (aIsCompany) return -1;
    if (bIsCompany) return 1;
    return a.name.localeCompare(b.name);
  });

  // Initialize selected labourer using sorted list
  useEffect(() => {
    if (sortedLabours.length > 0 && !selectedLabourId) {
      setSelectedLabourId(sortedLabours[0]._id);
    }
  }, [sortedLabours, selectedLabourId]);

  const selectedLabour = sortedLabours.find(l => l._id === selectedLabourId);
  const isCompany = selectedLabour?.empCode === 'COMPANY' || selectedLabour?.name === 'Company Expenses';

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabourId || !advAmount) return;
    setAdvSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/advances/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          labourId: selectedLabourId,
          amount: parseFloat(advAmount),
          date: new Date(),
          reason: advReason
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAdvAmount('');
        setAdvReason('');
        if (data.status === 'approved') {
          showToast(isCompany ? `Cash request Auto-Approved! (₹${data.amount} recorded)` : `Advance Auto-Approved! (₹${data.amount} recorded)`, 'success');
        } else {
          showToast(isCompany ? 'Cash request sent successfully! Awaiting Owner approval.' : 'Advance requested successfully! Awaiting Owner approval.', 'success');
        }
        onAdvanceSubmitted();
        onNavigate('dashboard');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.message || 'Failed to submit request', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'danger');
    } finally {
      setAdvSubmitting(false);
    }
  };

  return (
    <div className="request-advance-container animate-fade-in">
      <div className="request-advance-title-section">
        <h1 className="request-advance-title">
          {isCompany ? 'Request Cash for Company Expenses' : 'Request Labour Salary Advance'}
        </h1>
        <p className="request-advance-subtitle">
          {isCompany 
            ? 'Request cash from Bafnatoys to cover company operational expenses.' 
            : `Request advance wages for a labourer. Amounts up to ₹${autoApproveLimit} are auto-approved.`
          }
        </p>
      </div>

      <div className="request-advance-split-layout">
        <div className="request-advance-form-side">
          <div className="glass-panel request-advance-card" style={{ width: '100%', maxWidth: '600px' }}>
            <form onSubmit={handleAdvanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Select Recipient / Purpose</label>
                <select 
                  className="form-input"
                  value={selectedLabourId}
                  onChange={e => setSelectedLabourId(e.target.value)}
                  required
                >
                  {sortedLabours.map(lab => (
                    <option key={lab._id} value={lab._id}>
                      {lab.empCode === 'COMPANY' ? '🏢 Company Expenses (For Office / Operations)' : lab.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isCompany ? 'Amount Requested (₹)' : 'Advance Amount Requested (₹)'}
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Enter amount"
                  value={advAmount}
                  onChange={e => setAdvAmount(e.target.value)}
                  required
                />
                {autoApproveLimit > 0 && (
                  <p style={{ fontSize: '0.85rem', color: (parseFloat(advAmount || '0') <= autoApproveLimit) ? 'var(--color-success)' : 'var(--color-warning)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="chat-status-dot" style={{ background: (parseFloat(advAmount || '0') <= autoApproveLimit) ? 'var(--color-success)' : 'var(--color-warning)' }}></span>
                    {(parseFloat(advAmount || '0') <= autoApproveLimit) 
                      ? `Amount is within auto-approval limit (₹${autoApproveLimit}).`
                      : `Amount exceeds limit (₹${autoApproveLimit}). Will require Owner approval.`
                    }
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isCompany ? 'Reason / Purpose of Cash Request' : 'Reason / Purpose of Advance'}
                </label>
                <textarea 
                  className="form-input" 
                  placeholder={isCompany 
                    ? "Describe what company expenses this cash is needed for (e.g., office tea & snacks, petrol for vehicle, transporter payment, emergency repairs, etc.)" 
                    : "Describe why the labourer needs this advance (e.g., medical treatment, home festival, etc.)"
                  }
                  value={advReason}
                  onChange={e => setAdvReason(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={advSubmitting}>
                  {advSubmitting ? <Loader className="spinner" size={16} /> : (
                    parseFloat(advAmount || '0') <= autoApproveLimit 
                      ? (isCompany ? 'Record Auto-Approved Cash' : 'Record Auto-Approved Advance')
                      : 'Send Request to Owner'
                  )}
                </button>
                <button type="button" onClick={() => onNavigate('dashboard')} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Advances History Column */}
        <div className="glass-panel request-advance-history-side">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Recent Logs</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Showing cash received and advance logs.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                Total: {filteredTransactions.length}
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
                {filteredTransactions.slice(0, 8).map((tx) => {
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
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No recent cash received or advance transactions.
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
