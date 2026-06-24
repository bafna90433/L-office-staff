import { useState } from 'react';
import { Search, Calendar, AlertCircle, Plus } from 'lucide-react';
import '../styles/Tasks.css';

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
  comments: any[];
  createdAt: string;
}

interface TasksProps {
  tasks: Task[];
  onOpenTaskDetails: (task: Task) => void;
  onOpenCreateTask: () => void;
}

export default function Tasks({ tasks, onOpenTaskDetails, onOpenCreateTask }: TasksProps) {
  // Local filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'reminder-sir' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // 1. Status Filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    // 2. Type Filter
    if (typeFilter !== 'all' && task.taskType !== typeFilter) {
      return false;
    }
    // 3. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q) || false;
      const matchRemarks = task.remarks?.toLowerCase().includes(q) || false;
      return matchTitle || matchDesc || matchRemarks;
    }
    return true;
  });

  const getTodayString = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };
  const todayStr = getTodayString();

  // Sort: Today's followups first, then newest first
  const sortedFiltered = [...filteredTasks].sort((a, b) => {
    const aToday = a.nextFollowup === todayStr && a.status !== 'completed';
    const bToday = b.nextFollowup === todayStr && b.status !== 'completed';
    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // A task is "NEW" if created within the last 24 hours and still pending
  const isNewTask = (task: Task) =>
    task.status === 'pending' &&
    Date.now() - new Date(task.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="tasks-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="tasks-title" style={{ margin: 0 }}>My Work Desk</h1>
          <p className="tasks-subtitle" style={{ margin: '4px 0 0 0' }}>Check off regular operation checklists, review reminders for Sir, and write follow-up notes.</p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateTask} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px' }}>
          <Plus size={18} /> New Work / Follow-up
        </button>
      </div>

      {/* Filter controls */}
      <div className="glass-panel filter-bar">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
          <select 
            className="form-input" 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{ padding: '8px 12px', fontSize: '0.9rem' }}
          >
            <option value="pending">Pending Follow-ups</option>
            <option value="completed">Completed / Finished</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Work Type</label>
          <select 
            className="form-input" 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            style={{ padding: '8px 12px', fontSize: '0.9rem' }}
          >
            <option value="all">All Sheets</option>
            <option value="regular">Daily Works (Sheet1)</option>
            <option value="reminder-sir">Sir Reminders</option>
            <option value="custom">LULU & SPP Followups</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Checklist</label>
          <div className="search-input-wrapper">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search titles, remarks, overview..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', fontSize: '0.9rem', width: '100%' }}
            />
            <Search size={16} className="search-icon" />
          </div>
        </div>
      </div>

      {/* Tasks list grid */}
      <div className="task-list">
        {sortedFiltered.map(task => {
          const isCompleted = task.status === 'completed';
          const isNew = isNewTask(task);
          const isTodayFollowup = task.nextFollowup === todayStr && !isCompleted;
          
          let cardBorder = {};
          if (isTodayFollowup) {
            cardBorder = { border: '2px solid var(--color-danger)', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' };
          } else if (isNew) {
            cardBorder = { border: '2px solid #6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.15), 0 4px 16px rgba(99,102,241,0.12)' };
          }

          return (
            <div
              key={task._id}
              className={`glass-panel task-card ${isCompleted ? 'task-card-completed' : ''}`}
              style={cardBorder}
              onClick={() => onOpenTaskDetails(task)}
            >
              <div className="flex-between">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {isNew && (
                    <span style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      letterSpacing: '0.5px',
                      animation: 'newBadgePulseWB 1.5s infinite',
                    }}>
                      ✨ NEW
                    </span>
                  )}
                  <span className={`badge ${
                    task.taskType === 'reminder-sir' ? 'badge-warning' :
                    task.taskType === 'custom' ? 'badge-info' : 'badge-success'
                  }`} style={{ textTransform: 'capitalize' }}>
                    {task.taskType === 'reminder-sir' ? 'sir reminder' : task.taskType}
                  </span>
                  <span className={`badge ${isCompleted ? 'badge-success' : 'badge-danger'}`}>
                    {task.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Created: {new Date(task.createdAt).toLocaleDateString('en-GB')}
                </div>
              </div>

              <div className="task-title-line">
                <h3 className="task-title" style={{ textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.75 : 1 }}>
                  {task.title}
                </h3>
                {task.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', margin: 0 }}>
                    <strong>Overview:</strong> {task.description}
                  </p>
                )}
              </div>

              {/* Followup footer info */}
              <div className="task-meta-footer">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Remarks:</span>{' '}
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.remarks || 'No remarks added'}</span>
                </div>
                <div className="task-next-followup">
                  <span style={{ color: 'var(--text-secondary)' }}>Next Followup:</span>{' '}
                  <span style={{ 
                    fontWeight: 600, 
                    color: isTodayFollowup ? 'var(--color-danger)' : 'var(--accent-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}>
                    <Calendar size={14} /> 
                    {task.nextFollowup ? (
                      isTodayFollowup ? '🔥 TODAY' : (
                        !isNaN(new Date(task.nextFollowup).getTime())
                          ? new Date(task.nextFollowup).toLocaleDateString('en-GB')
                          : task.nextFollowup
                      )
                    ) : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p>No tasks match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
