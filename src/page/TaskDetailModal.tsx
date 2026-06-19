import { useState, useEffect } from 'react';
import { Loader, Send } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  taskType: 'regular' | 'reminder-sir' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  status: 'pending' | 'completed';
  completedBy?: {
    name: string;
  };
  completedAt?: string;
  description?: string;
  remarks?: string;
  nextFollowup?: string;
  comments: Array<{
    authorName: string;
    authorRole: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface TaskDetailModalProps {
  task: Task;
  token: string | null;
  user: any;
  apiBase: string;
  onClose: () => void;
  onTaskUpdated: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export default function TaskDetailModal({ 
  task, 
  token, 
  user,
  apiBase, 
  onClose, 
  onTaskUpdated, 
  showToast 
}: TaskDetailModalProps) {
  const getInitialDescription = (currentTask: Task) => {
    const savedDescription = currentTask.description?.trim();
    return savedDescription && savedDescription.length > 0
      ? currentTask.description || ''
      : `${currentTask.title} `;
  };

  const [editDescription, setEditDescription] = useState(getInitialDescription(task));
  const [editRemarks, setEditRemarks] = useState(task.remarks || '');
  const [editNextFollowup, setEditNextFollowup] = useState(task.nextFollowup || '');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [newCommentText, setNewCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Sync state if task changes
  useEffect(() => {
    setEditDescription(getInitialDescription(task));
    setEditRemarks(task.remarks || '');
    setEditNextFollowup(task.nextFollowup || '');
  }, [task]);

  const handleSaveTaskDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDetails(true);
    try {
      const res = await fetch(`${apiBase}/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: editDescription,
          remarks: editRemarks,
          nextFollowup: editNextFollowup
        })
      });

      if (res.ok) {
        showToast('Task follow-up details updated!', 'success');
        onTaskUpdated();
      } else {
        showToast('Failed to update task details', 'danger');
      }
    } catch (err) {
      console.error('Error updating task details:', err);
      showToast('Error saving updates', 'danger');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleCompleteTask = async () => {
    try {
      const res = await fetch(`${apiBase}/tasks/${task._id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Task marked completed successfully!', 'success');
        onTaskUpdated();
        onClose();
      } else {
        showToast('Failed to complete task', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/tasks/${task._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newCommentText })
      });
      if (res.ok) {
        setNewCommentText('');
        onTaskUpdated();
      } else {
        showToast('Failed to add comment', 'danger');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="glass-panel glass-panel-glow animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '32px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'uppercase' }}>
            {task.status}
          </span>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '4px 8px', borderRadius: '50%', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {task.title}
        </h3>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid rgba(124, 58, 237, 0.1)' }}>
          Category: <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{task.taskType} ({task.frequency})</span>
        </p>

        {/* Editable Details Form */}
        <form onSubmit={handleSaveTaskDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Work Overview / Description</label>
            <textarea 
              className="form-input" 
              placeholder="e.g. Toys assorted work, Kolkata Stock, etc."
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              style={{ minHeight: '84px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Remarks / Current Updates</label>
            <textarea 
              className="form-input" 
              placeholder="Enter details of work done, issues faced, etc."
              value={editRemarks}
              onChange={e => setEditRemarks(e.target.value)}
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Next Followup Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={editNextFollowup}
              onChange={e => setEditNextFollowup(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', flexGrow: 1 }} disabled={isSavingDetails}>
              {isSavingDetails ? <Loader className="spinner" size={16} /> : 'Save Follow-up Details'}
            </button>
            
            {task.status !== 'completed' && (
              <button 
                type="button" 
                onClick={handleCompleteTask}
                className="btn btn-success"
                style={{ padding: '10px 20px' }}
              >
                Finish Work
              </button>
            )}
          </div>
        </form>

        {/* Comments List */}
        <div style={{ borderTop: '1px solid rgba(124, 58, 237, 0.1)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Discussion Comments</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {task.comments && task.comments.length > 0 ? (
              task.comments.map((c, index) => {
                const isStaffSelf = c.authorName === user?.name;
                return (
                  <div 
                    key={index}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      maxWidth: '85%',
                      alignSelf: isStaffSelf ? 'flex-end' : 'flex-start',
                      background: isStaffSelf ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-tertiary)',
                      border: isStaffSelf ? '1px solid rgba(124, 58, 237, 0.15)' : '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: isStaffSelf ? 'var(--accent-primary)' : 'var(--accent-secondary)' }}>
                        {c.authorName} ({c.authorRole === 'owner' ? 'Owner' : 'Staff'})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {c.text}
                    </p>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                No follow-up notes or messages posted yet.
              </div>
            )}
          </div>

          {/* Comment Input Form */}
          <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Post an update comment..."
              value={newCommentText}
              onChange={e => setNewCommentText(e.target.value)}
              required
              style={{ flexGrow: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={commentSubmitting} style={{ padding: '10px 16px' }}>
              {commentSubmitting ? <Loader className="spinner" size={14} /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
