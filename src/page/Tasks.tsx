
import '../styles/Tasks.css';

interface Task {
  _id: string;
  title: string;
  taskType: 'regular' | 'reminder-sir' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  status: 'pending' | 'completed';
  completedAt?: string;
  createdAt: string;
  comments: any[];
}

interface TasksProps {
  tasks: Task[];
  onOpenTaskDetails: (task: Task) => void;
  onCompleteTask: (id: string) => void;
}

export default function Tasks({ tasks, onOpenTaskDetails, onCompleteTask }: TasksProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="tasks-header">
        <h1 className="tasks-title">My Work Desk</h1>
        <p className="tasks-subtitle">Check off regular operation checklists, review reminders for Sir, and write follow-up notes.</p>
      </div>

      <div className="glass-panel tasks-panel">
        <h3 style={{ fontSize: '1.25rem' }}>Your Assigned Checklist</h3>
        <div className="tasks-list">
          {tasks.map((t) => {
            const isCompleted = t.status === 'completed';
            return (
              <div 
                key={t._id} 
                className={`animate-fade-in task-item ${isCompleted ? 'task-item-completed' : ''}`}
              >
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span className={`badge ${
                      t.taskType === 'regular' ? 'badge-info' : 
                      t.taskType === 'reminder-sir' ? 'badge-warning' : 
                      'badge-success'
                    }`} style={{ textTransform: 'capitalize' }}>
                      {t.taskType === 'reminder-sir' ? 'sir reminder' : t.taskType}
                    </span>
                    <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                      {t.frequency}
                    </span>
                    <span className={`badge ${isCompleted ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'uppercase' }}>
                      {t.status}
                    </span>
                  </div>

                  <p 
                    className="task-item-title" 
                    style={{ 
                      textDecoration: isCompleted ? 'line-through' : 'none', 
                      opacity: isCompleted ? 0.7 : 1 
                    }}
                  >
                    {t.title}
                  </p>

                  <div className="task-item-meta">
                    {isCompleted ? (
                      <span>
                        Completed at {new Date(t.completedAt!).toLocaleString('en-GB')}
                      </span>
                    ) : (
                      <span>Created: {new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => onOpenTaskDetails(t)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    💬 {t.comments?.length || 0} Comments
                  </button>

                  {!isCompleted && (
                    <button 
                      onClick={() => onCompleteTask(t._id)}
                      className="btn btn-success"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              No assigned tasks found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
