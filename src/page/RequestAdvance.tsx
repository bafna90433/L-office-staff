import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import '../styles/RequestAdvance.css';

interface Labour {
  _id: string;
  name: string;
  whatsapp: string;
  monthlySalary: number;
  imageUrl: string;
}

interface RequestAdvanceProps {
  token: string | null;
  apiBase: string;
  labours: Labour[];
  onNavigate: (tab: 'dashboard' | 'log-expense' | 'request-advance' | 'history' | 'reminders' | 'tasks' | 'chat') => void;
  onAdvanceSubmitted: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function RequestAdvance({ 
  token, 
  apiBase, 
  labours, 
  onNavigate, 
  onAdvanceSubmitted, 
  showToast 
}: RequestAdvanceProps) {
  const [selectedLabourId, setSelectedLabourId] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advReason, setAdvReason] = useState('');
  const [advSubmitting, setAdvSubmitting] = useState(false);
  const [autoApproveLimit, setAutoApproveLimit] = useState(5000);

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
    <div className="request-advance-container">
      <div className="request-advance-title-section">
        <h1 className="request-advance-title">
          {isCompany ? 'Request Cash for Company Expenses' : 'Request Labour Salary Advance'}
        </h1>
        <p className="request-advance-subtitle">
          {isCompany 
            ? 'Request cash from MD to cover company operational expenses.' 
            : `Request advance wages for a labourer. Amounts up to ₹${autoApproveLimit} are auto-approved.`
          }
        </p>
      </div>

      <div className="glass-panel request-advance-card">
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
  );
}
