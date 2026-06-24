import { Plus, ArrowUpRight, Bell, AlertTriangle } from 'lucide-react';
import '../styles/Dashboard.css';

interface CashTx {
  _id: string;
  txType: 'received' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMode?: 'handcash' | 'online';
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
  onAcknowledgeReminder: (id: string, targetDate?: string) => void;
}

export default function Dashboard({
  transactions,
  advances,
  reminders,
  cashBalance,
  onNavigate,
  onAcknowledgeReminder
}: DashboardProps) {
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
        details = 'Cash Received from MD';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <style>{`
        @keyframes urgentPulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        .urgent-pulse {
          animation: urgentPulse 2s infinite;
        }
        @keyframes blinkDot {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Staff Desk Dashboard</h1>
        <p className="dashboard-subtitle">Log daily cash expenses and request advances for active labourers.</p>
      </div>

      {/* Glowing Notice Banner */}
      {reminders.filter(r => r.status === 'pending').map(rem => {
        const timeDiff = new Date(rem.targetDate).getTime() - Date.now();
        const isUrgent = timeDiff <= 10 * 60 * 1000;
        
        return (
        <div 
          key={rem._id} 
          className={`glass-panel animate-fade-in notice-banner ${isUrgent ? 'urgent-pulse' : ''}`} 
          style={{ 
            borderLeft: isUrgent ? '4px solid var(--color-danger)' : (rem.type === 'salary-delay' ? '4px solid #dc2626' : '4px solid var(--accent-color)'),
            border: isUrgent ? '2px solid var(--color-danger)' : undefined,
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
              {rem.type === 'salary-delay' ? 'Salary Delay Alert & Advance Call' : 'Important Notice from MD'}
            </div>
            <p className="notice-text" style={{ fontSize: '1.05rem', fontWeight: 650, margin: '8px 0' }}>{rem.message}</p>
            <p className="notice-date" style={{ fontSize: '0.8rem', color: isUrgent ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: isUrgent ? 600 : 'normal' }}>
              {isUrgent && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', marginRight: '6px', animation: 'blinkDot 1s infinite' }} />}
              Target: {new Date(rem.targetDate).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', hour12: true }).toUpperCase()}
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
      )})}

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
            <Plus size={18} /> Record Cash / Expense
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
                  <th>Payment Mode</th>
                  <th>Amount</th>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
                          {tx.paymentMode === 'online' ? '🌐 Online (Bank / UPI)' : '💵 Cash (Handcash)'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: tx.txType === 'received' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                        {tx.txType === 'received' ? '+' : '-'}₹{tx.amount}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
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
                  <div style={{ fontWeight: 600 }}>{req.labourId?.name || 'Deleted Employee'}</div>
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
