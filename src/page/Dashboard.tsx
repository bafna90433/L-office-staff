import { Plus, ArrowUpRight, Bell, AlertTriangle } from 'lucide-react';
import '../styles/Dashboard.css';

interface CashTx {
  _id: string;
  txType: 'received' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface AdvanceRequest {
  _id: string;
  labourId: {
    name: string;
    imageUrl: string;
  };
  amount: number;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DashboardProps {
  transactions: CashTx[];
  advances: AdvanceRequest[];
  reminders: any[];
  cashBalance: {
    totalReceived: number;
    totalSpent: number;
    activeBalance: number;
  };
  onNavigate: (tab: 'dashboard' | 'log-expense' | 'request-advance' | 'history' | 'reminders' | 'tasks' | 'chat') => void;
  onAcknowledgeReminder: (id: string) => void;
}

export default function Dashboard({
  transactions,
  advances,
  reminders,
  cashBalance,
  onNavigate,
  onAcknowledgeReminder
}: DashboardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Staff Desk Dashboard</h1>
        <p className="dashboard-subtitle">Log daily cash expenses and request advances for active labourers.</p>
      </div>

      {/* Glowing Notice Banner */}
      {reminders.filter(r => r.status === 'pending').map(rem => (
        <div 
          key={rem._id} 
          className="glass-panel animate-fade-in notice-banner" 
          style={{ 
            borderLeft: rem.type === 'salary-delay' ? '4px solid #dc2626' : '4px solid var(--accent-color)',
            background: rem.type === 'salary-delay' ? 'rgba(220, 38, 38, 0.05)' : 'var(--glass-bg)'
          }}
        >
          <div>
            <div 
              className="notice-badge" 
              style={{ 
                color: rem.type === 'salary-delay' ? '#dc2626' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {rem.type === 'salary-delay' ? <AlertTriangle size={16} /> : <Bell size={16} />} 
              {rem.type === 'salary-delay' ? 'Salary Delay Alert & Advance Call' : 'Important Notice from Owner'}
            </div>
            <p className="notice-text" style={{ fontSize: '1.05rem', fontWeight: 650, margin: '8px 0' }}>{rem.message}</p>
            <p className="notice-date" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Expected Payout Date: {new Date(rem.targetDate).toLocaleDateString('en-GB')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            {rem.type === 'salary-delay' && (
              <button 
                onClick={() => onNavigate('request-advance')} 
                className="btn btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Request Advance
              </button>
            )}
            <button 
              onClick={() => onAcknowledgeReminder(rem._id)} 
              className="btn btn-success" 
              style={{ padding: '8px 16px', fontSize: '0.85rem', background: rem.type === 'salary-delay' ? '#16a34a' : '' }}
            >
              OK, Got it
            </button>
          </div>
        </div>
      ))}

      {/* Cash Balance Display */}
      <div className="glass-panel petty-cash-card">
        <div>
          <h3 className="petty-cash-label">Your Available Petty Cash Balance</h3>
          <div className="petty-cash-value">
            ₹{cashBalance.activeBalance.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="petty-cash-actions" style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => onNavigate('log-expense')} className="btn btn-primary">
            <Plus size={18} /> Record Expense
          </button>
          <button onClick={() => onNavigate('request-advance')} className="btn btn-secondary">
            <ArrowUpRight size={18} /> Request Advance
          </button>
        </div>
      </div>

      {/* Quick Actions List */}
      <div className="dashboard-grid">
        {/* Recent Entries */}
        <div className="glass-panel recent-entries-panel">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Your Recent Logs</h3>
          <div className="table-container" style={{ maxHeight: '300px', margin: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Details</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((tx) => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ fontWeight: 500 }}>{tx.description}</td>
                    <td>
                      <span className={`badge ${
                        tx.txType === 'received' ? 'badge-success' : 'badge-info'
                      }`}>
                        {tx.txType === 'received' ? 'RECEIVED' : tx.category.replace('-', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: tx.txType === 'received' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                      {tx.txType === 'received' ? '+' : '-'}₹{tx.amount}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No recent cash transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advance requests status */}
        <div className="glass-panel labour-advances-panel">
          <h3 style={{ fontSize: '1.25rem' }}>Labour Advances Desk</h3>
          <div className="advances-list">
            {advances.slice(0, 5).map((req) => (
              <div key={req._id} className="advance-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{req.labourId.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹{req.amount} | {new Date(req.date).toLocaleDateString('en-GB')}</div>
                </div>
                <span className={`badge ${
                  req.status === 'approved' ? 'badge-success' :
                  req.status === 'rejected' ? 'badge-danger' :
                  'badge-warning'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
            {advances.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                No advances requested yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
