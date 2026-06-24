import React, { useState } from 'react';
import { Loader, X } from 'lucide-react';

interface CreateTaskModalProps {
  token: string | null;
  user: any;
  apiBase: string;
  onClose: () => void;
  onTaskCreated: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function CreateTaskModal({
  token,
  user,
  apiBase,
  onClose,
  onTaskCreated,
  showToast
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<'regular' | 'reminder-sir' | 'custom'>('custom');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'one-time'>('one-time');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Title is required', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          taskType,
          frequency,
          description: description.trim(),
          remarks: remarks.trim(),
          nextFollowup: nextFollowup || undefined,
          assignedTo: user?._id || user?.id || null
        })
      });

      if (res.ok) {
        showToast('Task created successfully!', 'success');
        onTaskCreated();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to create task', 'danger');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      showToast('Error connecting to server', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="glass-panel glass-panel-glow animate-fade-in" style={{ width: '100%', maxWidth: '580px', padding: '32px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ➕ Create New Work / Follow-up
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '4px 8px', borderRadius: '50%', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Work Title / Subject</label>
            <input 
              type="text"
              className="form-input" 
              placeholder="e.g. Check boys room EB bill receipt, check stickers inventory"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Work Type / Category</label>
              <select 
                className="form-input" 
                value={taskType}
                onChange={e => setTaskType(e.target.value as any)}
                style={{ padding: '10px 12px' }}
              >
                <option value="custom">LULU & SPP Followup</option>
                <option value="regular">Daily Work (Sheet1)</option>
                <option value="reminder-sir">Sir Reminder</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Frequency</label>
              <select 
                className="form-input" 
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                style={{ padding: '10px 12px' }}
              >
                <option value="one-time">One-Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Work Overview / Description</label>
            <textarea 
              className="form-input" 
              placeholder="Enter details about what needs to be done..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Remarks / Initial Status</label>
            <textarea 
              className="form-input" 
              placeholder="Enter any initial remarks or current status..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{ minHeight: '60px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Next Followup Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={nextFollowup}
              onChange={e => setNextFollowup(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isSubmitting}>
              {isSubmitting ? <Loader className="spinner" size={16} /> : 'Create Work Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
