import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  LogOut, 
  Plus, 
  ArrowUpRight, 
  FileText, 
  Bell, 
  MessageSquare,
  User as UserIcon
} from 'lucide-react';

// Import Pages
import Login from './page/Login';
import Dashboard from './page/Dashboard';
import LogExpense from './page/LogExpense';
import RequestAdvance from './page/RequestAdvance';
import TransactionHistory from './page/TransactionHistory';
import Notices from './page/Notices';
import Tasks from './page/Tasks';
import Chat from './page/Chat';
import TaskDetailModal from './page/TaskDetailModal';
import Profile from './page/Profile';

const API_BASE = `http://${window.location.hostname}:5000/api`;

interface User {
  id: string;
  _id?: string;
  username: string;
  name: string;
  role: string;
  whatsapp?: string;
  imageUrl?: string;
}

interface Labour {
  _id: string;
  name: string;
  whatsapp: string;
  monthlySalary: number;
  imageUrl: string;
}

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

interface Task {
  _id: string;
  title: string;
  taskType: 'regular' | 'reminder-sir' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  status: 'pending' | 'completed';
  createdAt: string;
  comments: any[];
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('staff_token'));
  const [user, setUser] = useState<User | null>(null);

  // Router State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log-expense' | 'request-advance' | 'history' | 'reminders' | 'tasks' | 'chat' | 'profile'>('dashboard');

  // Shared Data States
  const [labours, setLabours] = useState<Labour[]>([]);
  const [transactions, setTransactions] = useState<CashTx[]>([]);
  const [advances, setAdvances] = useState<AdvanceRequest[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState({
    totalReceived: 0,
    totalSpent: 0,
    activeBalance: 0
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Selected Task for Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' | 'warning' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch current user if token exists
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  useEffect(() => {
    if (user && user.role === 'staff') {
      fetchDashboardData();
      fetchLabours();
      fetchAdvances();
      fetchReminders();
      fetchTasks();

      // Poll unread chat counts
      const chatInterval = setInterval(() => {
        fetchUnreadCount();
      }, 5000);
      return () => clearInterval(chatInterval);
    }
  }, [user]);

  // Fetch tasks on activeTab change
  useEffect(() => {
    if (user && user.role === 'staff' && activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab, user]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.role !== 'staff') {
          showToast('Access denied: Office Staff required.', 'danger');
          handleLogout();
        } else {
          setUser(data.user);
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    }
  };

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('staff_token', newToken);
    setToken(newToken);
    setUser(newUser);
    showToast('Logged in successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  const fetchDashboardData = async () => {
    try {
      // Balance data
      const balRes = await fetch(`${API_BASE}/expenses/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (balRes.ok) {
        const data = await balRes.json();
        setCashBalance({
          totalReceived: data.totalReceived,
          totalSpent: data.totalSpent,
          activeBalance: data.activeBalance
        });
      }

      // Recent Transactions
      const txRes = await fetch(`${API_BASE}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLabours = async () => {
    try {
      const res = await fetch(`${API_BASE}/labours`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLabours(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdvances = async () => {
    try {
      const res = await fetch(`${API_BASE}/advances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdvances(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await fetch(`${API_BASE}/reminders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter tasks assigned to staff specifically or general unassigned tasks
        const staffTasks = data.filter((t: any) => t.assignedTo?._id === user?._id || t.assignedTo?.username === 'staff' || !t.assignedTo);
        setTasks(staffTasks);
        
        // Sync selected task modal if open
        if (selectedTask) {
          const updated = staffTasks.find((t: Task) => t._id === selectedTask._id);
          if (updated) {
            setSelectedTask(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/messages/unread/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let count = 0;
        Object.values(data).forEach((val: any) => {
          count += val;
        });
        setUnreadCount(count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTasks();
        showToast('Task marked completed successfully!', 'success');
      } else {
        showToast('Failed to complete task', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeReminder = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/reminders/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchReminders();
        showToast('Notice acknowledged successfully!', 'success');
      } else {
        showToast('Failed to acknowledge notice', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Page Content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            transactions={transactions}
            advances={advances}
            reminders={reminders}
            cashBalance={cashBalance}
            onNavigate={setActiveTab}
            onAcknowledgeReminder={handleAcknowledgeReminder}
          />
        );
      case 'log-expense':
        return (
          <LogExpense 
            token={token}
            apiBase={API_BASE}
            onNavigate={setActiveTab}
            onExpenseSubmitted={fetchDashboardData}
            showToast={showToast}
          />
        );
      case 'request-advance':
        return (
          <RequestAdvance 
            token={token}
            apiBase={API_BASE}
            labours={labours}
            onNavigate={setActiveTab}
            onAdvanceSubmitted={fetchAdvances}
            showToast={showToast}
          />
        );
      case 'history':
        return <TransactionHistory transactions={transactions} />;
      case 'reminders':
        return (
          <Notices 
            reminders={reminders}
            onAcknowledgeReminder={handleAcknowledgeReminder}
          />
        );
      case 'tasks':
        return (
          <Tasks 
            tasks={tasks}
            onOpenTaskDetails={setSelectedTask}
            onCompleteTask={handleCompleteTask}
          />
        );
      case 'chat':
        return (
          <Chat 
            token={token}
            user={user}
            apiBase={API_BASE}
            showToast={showToast}
            onUnreadCountChange={fetchUnreadCount}
          />
        );
      case 'profile':
        return (
          <Profile 
            token={token}
            user={user}
            apiBase={API_BASE}
            onProfileUpdate={setUser}
            showToast={showToast}
          />
        );
      default:
        return <div>Page Not Found</div>;
    }
  };

  if (!token) {
    return <Login apiBase={API_BASE} onLoginSuccess={handleLoginSuccess} />;
  }

  // Pending counts for sidebar badges
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const pendingNoticesCount = reminders.filter(r => r.status === 'pending').length;

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Sidebar Layout */}
      <aside className="sidebar">
        <div>
          <h2 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>LABOUR PRO</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Desk</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-link btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <TrendingUp size={18} /> Staff Desk Overview
          </button>
          <button 
            onClick={() => setActiveTab('log-expense')} 
            className={`nav-link btn-secondary ${activeTab === 'log-expense' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <Plus size={18} /> Record New Expense
          </button>
          <button 
            onClick={() => setActiveTab('request-advance')} 
            className={`nav-link btn-secondary ${activeTab === 'request-advance' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <ArrowUpRight size={18} /> Request Labour Advance
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`nav-link btn-secondary ${activeTab === 'history' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <FileText size={18} /> Transaction History
          </button>
          <button 
            onClick={() => setActiveTab('reminders')} 
            className={`nav-link btn-secondary ${activeTab === 'reminders' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <Bell size={18} /> Owner Notices
            {pendingNoticesCount > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 'auto', padding: '2px 6px' }}>
                {pendingNoticesCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('tasks')} 
            className={`nav-link btn-secondary ${activeTab === 'tasks' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <FileText size={18} /> My Work Desk
            {pendingTasksCount > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 6px' }}>
                {pendingTasksCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`nav-link btn-secondary ${activeTab === 'chat' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <MessageSquare size={18} /> Chat with Owner
            {unreadCount > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 6px' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`nav-link btn-secondary ${activeTab === 'profile' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <UserIcon size={18} /> My Profile
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.name} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
            )}
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role === 'staff2' ? 'Office Staff 2' : 'Office Staff'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', padding: '10px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Task Details Modal Overlay */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          token={token}
          user={user}
          apiBase={API_BASE}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={fetchTasks}
          showToast={showToast}
        />
      )}

      {/* Toast Notification overlay */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <span>✅</span>}
            {toast.type === 'danger' && <span>❌</span>}
            {toast.type === 'warning' && <span>⚠️</span>}
            {toast.type === 'info' && <span>ℹ️</span>}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
