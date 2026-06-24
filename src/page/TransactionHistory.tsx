import { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, IndianRupee, RefreshCw, Pencil, Loader } from 'lucide-react';
import '../styles/TransactionHistory.css';

interface CashTx {
  _id: string;
  txType: 'received' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMode?: 'handcash' | 'online';
}

interface TransactionHistoryProps {
  transactions: CashTx[];
  token: string | null;
  apiBase: string;
  onUpdate: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function TransactionHistory({ 
  transactions,
  token,
  apiBase,
  onUpdate,
  showToast
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTx, setEditingTx] = useState<CashTx | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState<'handcash' | 'online'>('handcash');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartEdit = (tx: CashTx) => {
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
    setIsSubmitting(true);
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
        onUpdate();
      } else {
        const errorData = await res.json();
        showToast(errorData.message || 'Failed to update transaction', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Helper to parse description into details, reason, and status info
  const parseDescription = (description: string, category: string, txType: string) => {
    let details = '';
    let reason = '';
    let statusText = '';
    let statusClass = '';

    const reasonMarker = '. Reason: ';
    const directReasonMarker = 'Reason: ';
    
    let mainText = '';
    if (description.includes(reasonMarker)) {
      const parts = description.split(reasonMarker);
      mainText = parts[0];
      reason = parts.slice(1).join(reasonMarker);
    } else if (description.includes(directReasonMarker)) {
      const parts = description.split(directReasonMarker);
      mainText = parts[0];
      reason = parts.slice(1).join(directReasonMarker);
    } else {
      if (txType === 'received') {
        mainText = 'Cash Received from Bafnatoys';
      } else {
        mainText = category.replace('-', ' ').toUpperCase();
      }
      reason = description || '--';
    }

    // Extract status from mainText
    if (mainText.includes('(Auto-Approved)')) {
      details = mainText.replace('(Auto-Approved)', '').trim();
      statusText = 'Auto-Approved';
      statusClass = 'badge-success';
    } else if (mainText.includes('(Approved by Owner)')) {
      details = mainText.replace('(Approved by Owner)', '').trim();
      statusText = 'MD Approved';
      statusClass = 'badge-info';
    } else if (mainText.includes('(By Owner)')) {
      details = mainText.replace('(By Owner)', '').trim();
      statusText = 'Direct Advance';
      statusClass = 'badge-warning';
    } else {
      details = mainText;
      if (txType === 'received') {
        statusText = 'Received';
        statusClass = 'badge-success';
      } else {
        statusText = 'Direct Expense';
        statusClass = 'badge-secondary';
      }
    }

    details = details.replace(/\s+/g, ' ').trim();
    if (details.endsWith('.')) {
      details = details.slice(0, -1);
    }

    return { details, reason, statusText, statusClass };
  };

  // Process transactions with parsed fields for filtering
  const processedTransactions = transactions.map(tx => {
    const parsed = parseDescription(tx.description, tx.category, tx.txType);
    return {
      ...tx,
      parsedDetails: parsed.details,
      parsedReason: parsed.reason,
      parsedStatusText: parsed.statusText,
      parsedStatusClass: parsed.statusClass
    };
  });

  // Apply filters
  const filteredTransactions = processedTransactions.filter(tx => {
    // 1. Search Query Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchDetails = tx.parsedDetails.toLowerCase().includes(query);
      const matchReason = tx.parsedReason.toLowerCase().includes(query);
      const matchCategory = tx.category.toLowerCase().includes(query);
      if (!matchDetails && !matchReason && !matchCategory) {
        return false;
      }
    }

    // 2. Category Filter
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
      return false;
    }

    // 3. Payment Mode Filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'online' && tx.paymentMode !== 'online') return false;
      if (paymentFilter === 'handcash' && tx.paymentMode === 'online') return false;
    }

    // 4. Status Filter
    if (statusFilter !== 'all') {
      if (tx.parsedStatusText.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Calculate unique categories from original transactions for the dropdown filter
  const uniqueCategories = Array.from(new Set(transactions.map(tx => tx.category)));

  // Calculate filtered stats
  const totalInflow = filteredTransactions
    .filter(tx => tx.txType === 'received')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalOutflow = filteredTransactions
    .filter(tx => tx.txType === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netFlow = totalInflow - totalOutflow;

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setPaymentFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="history-container animate-fade-in">
      <div className="history-title-section">
        <h1 className="history-title">Complete Cashbook Log</h1>
        <p className="history-subtitle">Chronological list of all expenses and cash received entries.</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Total Inflow</span>
            <ArrowUpRight size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            +₹{totalInflow.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Incoming cash received</span>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 20px', borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Total Outflow</span>
            <ArrowDownRight size={18} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            -₹{totalOutflow.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outgoing spent cash</span>
        </div>

        <div className="glass-panel" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          padding: '16px 20px', 
          borderLeft: netFlow >= 0 ? '4px solid var(--accent-secondary)' : '4px solid var(--color-danger)',
          background: netFlow >= 0 ? 'rgba(8, 145, 178, 0.02)' : 'rgba(220, 38, 38, 0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Net Flow / Balance</span>
            <IndianRupee size={16} style={{ color: netFlow >= 0 ? 'var(--accent-secondary)' : 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: netFlow >= 0 ? 'var(--accent-secondary)' : 'var(--color-danger)' }}>
            {netFlow >= 0 ? '+' : '-'}₹{Math.abs(netFlow).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net difference in selected log</span>
        </div>
      </div>

      {/* Premium Glassmorphic Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Search by details, reason, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: '42px', padding: '8px 12px 8px 36px', fontSize: '0.9rem' }}
          />
        </div>

        {/* Category */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <select
            className="form-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '100%', height: '42px', padding: '0 12px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <option value="all">📁 All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat.replace('-', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Payment Mode */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <select
            className="form-input"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ width: '100%', height: '42px', padding: '0 12px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <option value="all">💳 All Payments</option>
            <option value="handcash">💵 Cash (Handcash)</option>
            <option value="online">🌐 Online (Bank / UPI)</option>
          </select>
        </div>

        {/* Status */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', height: '42px', padding: '0 12px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <option value="all">⚡ All Statuses</option>
            <option value="auto-approved">🟢 Auto-Approved</option>
            <option value="md approved">🔵 MD Approved</option>
            <option value="direct advance">🟡 Direct Advance</option>
            <option value="received">🟢 Received Inflow</option>
            <option value="direct expense">⚪ Direct Expense</option>
          </select>
        </div>

        {/* Clear Button */}
        {(searchQuery || categoryFilter !== 'all' || paymentFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={handleClearFilters}
            className="btn btn-secondary"
            style={{ height: '42px', padding: '0 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Clear
          </button>
        )}
      </div>

      <div className="glass-panel">
        <div className="table-container" style={{ margin: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Details</th>
                <th>Status</th>
                <th>Description / Reason</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                  <td>
                    <span className={`badge ${
                      tx.txType === 'received' ? 'badge-success' : 'badge-info'
                    }`}>
                      {tx.txType === 'received' ? 'RECEIVED' : tx.category.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
                      {tx.paymentMode === 'online' ? '🌐 Online (Bank / UPI)' : '💵 Cash (Handcash)'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: tx.txType === 'received' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                    {tx.txType === 'received' ? '+' : '-'}₹{tx.amount}
                  </td>
                  <td style={{ fontWeight: 600 }}>{tx.parsedDetails}</td>
                  <td>
                    <span className={`badge ${tx.parsedStatusClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {tx.parsedStatusText}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontStyle: tx.parsedReason === '--' ? 'italic' : 'normal' }}>
                    {tx.parsedReason}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleStartEdit(tx)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.75rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No transactions found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader className="spinner" size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Changes'}
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
