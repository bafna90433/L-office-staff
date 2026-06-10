import { CheckCircle } from 'lucide-react';
import '../styles/Notices.css';

interface NoticesProps {
  reminders: any[];
  onAcknowledgeReminder: (id: string) => void;
}

export default function Notices({ reminders, onAcknowledgeReminder }: NoticesProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="notices-header">
        <h1 className="notices-title">Notices & alerts</h1>
        <p className="notices-subtitle">Acknowledge formal notices and travel updates sent directly by the Owner.</p>
      </div>

      <div className="glass-panel notices-panel">
        <h3 style={{ fontSize: '1.25rem' }}>Active Notices</h3>
        <div className="notices-list">
          {reminders.map((rem) => (
            <div key={rem._id} className="animate-fade-in notice-card">
              <div style={{ flexGrow: 1 }}>
                <div className="notice-meta">
                  <span className="badge badge-info" style={{ fontWeight: 700 }}>
                    Target Date: {new Date(rem.targetDate).toLocaleDateString('en-GB')}
                  </span>
                  <span className={`badge ${
                    rem.status === 'acknowledged' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {rem.status}
                  </span>
                </div>
                
                <p className="notice-card-text">{rem.message}</p>

                <div className="notice-card-footer">
                  Sent by <span style={{ fontWeight: 600 }}>{rem.createdBy?.name || 'Owner'}</span> on {new Date(rem.createdAt).toLocaleDateString('en-GB')}
                </div>
              </div>

              <div>
                {rem.status === 'pending' ? (
                  <button 
                    onClick={() => onAcknowledgeReminder(rem._id)} 
                    className="btn btn-success notice-action-btn" 
                    style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <CheckCircle size={16} /> OK, Got it
                  </button>
                ) : (
                  <div className="notice-acknowledged-info">
                    <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={16} /> Acknowledged
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      by {rem.acknowledgedBy?.name || 'You'} at {new Date(rem.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {reminders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              No notices or reminders from the Owner.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
