import { useState, useEffect, useRef } from 'react';
import { Paperclip, Send, Loader, Trash2, AlertTriangle } from 'lucide-react';
import '../styles/Chat.css';

interface ChatProps {
  token: string | null;
  user: any;
  apiBase: string;
  showToast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  onUnreadCountChange: () => void;
}

export default function Chat({ token, user, apiBase, showToast, onUnreadCountChange }: ChatProps) {
  const [ownerUser, setOwnerUser] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatFilePreview, setChatFilePreview] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const IMAGEKIT_PUBLIC_KEY = 'public_LB0AyCgim15VO491kDtVm0Fo798=';

  const handleImageUpload = async (file: File): Promise<string> => {
    const authRes = await fetch(`${apiBase}/imagekit/auth`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!authRes.ok) {
      throw new Error('Could not fetch ImageKit signature');
    }
    const authParams = await authRes.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
    formData.append('signature', authParams.signature);
    formData.append('expire', authParams.expire.toString());
    formData.append('token', authParams.token);

    const upRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData
    });

    if (!upRes.ok) {
      throw new Error('Image upload failed');
    }
    const upData = await upRes.json();
    return upData.url;
  };

  const fetchOwnerUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/owner`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOwnerUser(data);
      }
    } catch (err) {
      console.error('Error fetching owner:', err);
    }
  };

  const fetchChatMessages = async (userId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
        onUnreadCountChange(); // Trigger update in parent sidebar
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerUser || (!chatInputText.trim() && !chatFile)) return;
    setChatSending(true);
    try {
      let mediaUrl = '';
      let mediaType = 'none';
      if (chatFile) {
        try {
          mediaUrl = await handleImageUpload(chatFile);
          mediaType = 'image';
        } catch (err) {
          showToast('Failed to upload attachment', 'danger');
          setChatSending(false);
          return;
        }
      }
      const res = await fetch(`${apiBase}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: ownerUser._id,
          text: chatInputText,
          mediaUrl,
          mediaType
        })
      });
      if (res.ok) {
        setChatInputText('');
        setChatFile(null);
        setChatFilePreview('');
        fetchChatMessages(ownerUser._id);
      } else {
        showToast('Failed to send message', 'danger');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatSending(false);
    }
  };

  const handleClearChat = () => {
    if (!ownerUser) return;
    setShowClearConfirm(true);
  };

  const executeClearChat = async () => {
    setShowClearConfirm(false);
    if (!ownerUser) return;
    
    try {
      const res = await fetch(`${apiBase}/messages/${ownerUser._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Chat cleared successfully', 'success');
        setChatMessages([]);
      } else {
        showToast('Failed to clear chat', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error clearing chat', 'danger');
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    fetchOwnerUser();
  }, [token]);

  useEffect(() => {
    if (!token || !ownerUser) return;

    fetchChatMessages(ownerUser._id);
    const interval = setInterval(() => {
      fetchChatMessages(ownerUser._id);
    }, 4000);
    return () => clearInterval(interval);
  }, [token, ownerUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: 'calc(100vh - 120px)' }}>
      <div className="chat-header-section">
        <h1 className="chat-title">Chat with Owner</h1>
        <p className="chat-subtitle">Communicate with the Owner in real-time, ask questions and share payment receipts.</p>
      </div>

      <div className="glass-panel chat-card-panel">
        {ownerUser ? (
          <>
            {/* Chat Header */}
            <div className="chat-active-header">
              {ownerUser.imageUrl ? (
                <img 
                  src={ownerUser.imageUrl} 
                  alt={ownerUser.name} 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '1px solid var(--glass-border)' 
                  }} 
                />
              ) : (
                <div className="chat-active-avatar">OW</div>
              )}
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 700 }}>{ownerUser.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="chat-status-dot"></span> Online
                </div>
              </div>
              <button 
                onClick={handleClearChat}
                style={{
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-danger)',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                title="Clear Chat"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Messages Window */}
            <div className="chat-window">
              {chatMessages.map((msg, index) => {
                const isSender = msg.sender === (user?._id || user?.id);
                return (
                  <div
                    key={msg._id || index}
                    className={`message-bubble-wrapper ${isSender ? 'message-sender' : 'message-receiver'}`}
                  >
                    <div className="message-bubble">
                      {msg.mediaUrl && msg.mediaType === 'image' && (
                        <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                          <img
                            src={msg.mediaUrl}
                            alt="Attachment"
                            className="message-attachment"
                          />
                        </a>
                      )}
                      <p className="message-text">{msg.text}</p>
                      <div className="message-meta">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isSender && (
                          <span style={{ color: msg.isRead ? '#3b82f6' : 'var(--text-secondary)' }}>
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {chatMessages.length === 0 && (
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ background: 'rgba(255,255,255,0.8)', padding: '12px 24px', borderRadius: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>🔒 End-to-End Encrypted</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>No messages yet. Send a message to start the conversation.</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSendChatMessage} className="chat-footer">
              {chatFilePreview && (
                <div className="chat-file-preview-bar">
                  <img src={chatFilePreview} alt="Preview" className="chat-file-preview-img" />
                  <span style={{ fontSize: '0.8rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chatFile?.name}</span>
                  <button type="button" onClick={() => { setChatFile(null); setChatFilePreview(''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-danger)' }}>✕</button>
                </div>
              )}

              <div className="chat-input-controls">
                <label className="chat-attach-btn" title="Attach Photo">
                  <Paperclip size={18} style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setChatFile(file);
                        setChatFilePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type your message here..."
                  value={chatInputText}
                  onChange={e => setChatInputText(e.target.value)}
                  style={{ flexGrow: 1 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }} disabled={chatSending}>
                  {chatSending ? <Loader className="spinner" style={{ width: '16px', height: '16px' }} /> : <Send size={18} />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', padding: '48px' }}>
            <Loader className="spinner" size={24} />
            <span>Loading Owner details...</span>
          </div>
        )}
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '16px', color: 'var(--color-danger)', display: 'flex', justifyContent: 'center' }}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Clear Chat?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to delete all messages in this chat? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowClearConfirm(false)} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={executeClearChat} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-danger)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
