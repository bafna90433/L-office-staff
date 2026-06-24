import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  LogOut, 
  Plus, 
  ArrowUpRight, 
  FileText, 
  Bell, 
  MessageSquare,
  Users
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
import CreateTaskModal from './page/CreateTaskModal';
import Profile from './page/Profile';
import Labourers from './page/Labourers';

const API_BASE = 'https://l-backend-production-ff32.up.railway.app/api';

interface User {
  id: string;
  _id?: string;
  username: string;
  name: string;
  role: string;
  whatsapp?: string;
  imageUrl?: string;
  upiId?: string;
}

interface Labour {
  _id: string;
  name: string;
  whatsapp: string;
  monthlySalary: number;
  workingHours?: number;
  shiftStart?: string;
  shiftEnd?: string;
  gender?: string;
  imageUrl: string;
  status: string;
  employeeType?: 'labourer' | 'staff';
  department?: string;
  phonePeNumber?: string;
  upiId?: string;
  phonePeQrUrl?: string;
  empCode?: string;
}

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

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('staff_token'));
  const [user, setUser] = useState<User | null>(null);

  // Router State
  const validTabs = ['dashboard', 'log-expense', 'request-advance', 'history', 'reminders', 'tasks', 'chat', 'profile', 'labourers'] as const;
  type TabType = typeof validTabs[number];
  const savedTab = localStorage.getItem('staff_active_tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(savedTab && validTabs.includes(savedTab) ? savedTab : 'dashboard');

  const navigateTo = (tab: TabType) => {
    localStorage.setItem('staff_active_tab', tab);
    setActiveTab(tab);
  };

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

  // Create Task Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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
    localStorage.removeItem('staff_active_tab');
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



  const handleAcknowledgeReminder = async (id: string, targetDate?: string) => {
    try {
      const payload: any = {};
      if (targetDate) payload.targetDate = targetDate;
      
      const res = await fetch(`${API_BASE}/reminders/${id}/acknowledge`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
            onNavigate={navigateTo}
            onAcknowledgeReminder={handleAcknowledgeReminder}
          />
        );
      case 'log-expense':
        return (
          <LogExpense 
            token={token}
            user={user}
            apiBase={API_BASE}
            labours={labours}
            showToast={showToast}
            onNavigate={navigateTo}
            onExpenseSubmitted={fetchDashboardData}
          />
        );
      case 'request-advance':
        return (
          <RequestAdvance 
            token={token}
            apiBase={API_BASE}
            labours={labours}
            onNavigate={navigateTo}
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
            apiBase={API_BASE}
            token={token!}
            showToast={showToast}
            onRefresh={fetchReminders}
          />
        );
      case 'tasks':
        return (
          <Tasks 
            tasks={tasks}
            onOpenTaskDetails={setSelectedTask}
            onOpenCreateTask={() => setIsCreateModalOpen(true)}
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
      case 'labourers':
        return (
          <Labourers 
            token={token}
            apiBase={API_BASE}
            labours={labours}
            advances={advances as any}
            fetchLabours={fetchLabours}
            setConfirmModal={setConfirmModal}
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
            onClick={() => navigateTo('dashboard')} 
            className={`nav-link btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <TrendingUp size={18} /> Staff Desk Overview
          </button>
          <button 
            onClick={() => navigateTo('log-expense')} 
            className={`nav-link btn-secondary ${activeTab === 'log-expense' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <Plus size={18} /> Record Cash / Expense
          </button>
          <button 
            onClick={() => navigateTo('request-advance')} 
            className={`nav-link btn-secondary ${activeTab === 'request-advance' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <ArrowUpRight size={18} /> Request Labour Advance
          </button>
          <button 
            onClick={() => navigateTo('labourers')} 
            className={`nav-link btn-secondary ${activeTab === 'labourers' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <Users size={18} /> Labourers
          </button>
          <button 
            onClick={() => navigateTo('history')} 
            className={`nav-link btn-secondary ${activeTab === 'history' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <FileText size={18} /> Transaction History
          </button>
          <button 
            onClick={() => navigateTo('reminders')} 
            className={`nav-link btn-secondary ${activeTab === 'reminders' ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
          >
            <Bell size={18} /> MD Notices
            {pendingNoticesCount > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 'auto', padding: '2px 6px' }}>
                {pendingNoticesCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => navigateTo('tasks')} 
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
            onClick={() => navigateTo('chat')} 
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
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div 
            onClick={() => navigateTo('profile')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '16px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'var(--transition-smooth)',
              border: activeTab === 'profile' ? '1px solid var(--accent-primary)' : '1px solid transparent',
              background: activeTab === 'profile' ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
            }}
          >
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

      {/* Create Task Modal Overlay */}
      {isCreateModalOpen && (
        <CreateTaskModal 
          token={token}
          user={user}
          apiBase={API_BASE}
          onClose={() => setIsCreateModalOpen(false)}
          onTaskCreated={() => {
            fetchTasks();
            setIsCreateModalOpen(false);
          }}
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

      {/* Confirm Modal Overlay */}
      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div className="glass-panel glass-panel-glow animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '32px', borderRadius: '16px', textAlign: 'center' }}>
            <h3 className="gradient-text" style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '16px' }}>{confirmModal.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6', fontSize: '1.05rem' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }} 
                className="btn btn-danger" 
                style={{ flex: 1, padding: '12px' }}
              >
                Yes, Confirm
              </button>
              <button 
                onClick={() => setConfirmModal(null)} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
