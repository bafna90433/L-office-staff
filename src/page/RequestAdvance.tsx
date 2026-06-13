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

  // Initialize selected labourer
  useEffect(() => {
    if (labours.length > 0 && !selectedLabourId) {
      setSelectedLabourId(labours[0]._id);
    }
  }, [labours]);

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
        setAdvAmount('');
        setAdvReason('');
        showToast('Advance requested successfully! Awaiting Owner approval.', 'success');
        onAdvanceSubmitted();
        onNavigate('dashboard');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.message || 'Failed to request advance', 'danger');
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
        <h1 className="request-advance-title">Request Labour Salary Advance</h1>
        <p className="request-advance-subtitle">Request advance wages for a labourer. Submits to Owner for approval.</p>
      </div>

      <div className="glass-panel request-advance-card">
        <form onSubmit={handleAdvanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Select Labourer</label>
            <select 
              className="form-input"
              value={selectedLabourId}
              onChange={e => setSelectedLabourId(e.target.value)}
              required
            >
              {labours.map(lab => (
                <option key={lab._id} value={lab._id}>{lab.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Advance Amount Requested (₹)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Enter amount"
              value={advAmount}
              onChange={e => setAdvAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Purpose of Advance</label>
            <textarea 
              className="form-input" 
              placeholder="Describe why the labourer needs this advance (e.g., medical treatment, home festival, etc.)"
              value={advReason}
              onChange={e => setAdvReason(e.target.value)}
              style={{ minHeight: '100px', resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={advSubmitting}>
              {advSubmitting ? <Loader className="spinner" size={16} /> : 'Send Request to Owner'}
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
