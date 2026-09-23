import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchUserChats,
  createNewChatSession,
  fetchChatMessages,
  sendVaultChatMessage,
  togglePin,
  deleteChatSession,
} from '../../api/vaultApi';
import {
  Send,
  Paperclip,
  Sparkles,
  AlertCircle,
  Trash2,
  Bot,
  User,
  CheckCircle2,
  Plus,
  Pin,
  PinOff,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Copy,
  Check,
  Database,
  Hash,
} from 'lucide-react';

export default function AuraVault() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('mini');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async (selectFirst = true) => {
    try {
      setLoadingChats(true);
      const data = await fetchUserChats();
      if (data.success) {
        setChats(data.chats);
        if (selectFirst && data.chats.length > 0 && !activeChatId) {
          const first = data.chats[0];
          selectChat(first.token || first.id);
        }
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const selectChat = async (chatTokenOrId) => {
    setActiveChatId(chatTokenOrId);
    setError(null);
    try {
      setLoading(true);
      const data = await fetchChatMessages(chatTokenOrId);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Could not load chat messages.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const data = await createNewChatSession('New Conversation');
      if (data.success) {
        const newIdentifier = data.chat.token || data.chat.id;
        setChats((prev) => [data.chat, ...prev]);
        setActiveChatId(newIdentifier);
        setMessages([]);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleTogglePin = async (e, chatTokenOrId) => {
    e.stopPropagation();
    try {
      const data = await togglePin(chatTokenOrId);
      if (data.success) {
        setChats((prev) =>
          prev
            .map((c) =>
              (c.token === chatTokenOrId || c.id === chatTokenOrId)
                ? { ...c, is_pinned: data.isPinned }
                : c
            )
            .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
        );
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleDeleteChat = async (e, chatTokenOrId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      const data = await deleteChatSession(chatTokenOrId);
      if (data.success) {
        const remaining = chats.filter(
          (c) => c.token !== chatTokenOrId && c.id !== chatTokenOrId
        );
        setChats(remaining);
        if (activeChatId === chatTokenOrId) {
          if (remaining.length > 0) {
            const next = remaining[0];
            selectChat(next.token || next.id);
          } else {
            setActiveChatId(null);
            setMessages([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleCopyChatId = () => {
    if (!activeChatId) return;
    const rawId = activeChatId.split('.')[0];
    navigator.clipboard.writeText(rawId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64: reader.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (loading) return;

    const userText = input.trim();
    const userAttachments = [...attachments];

    const tempUserMsg = {
      role: 'user',
      text: userText,
      attachments: userAttachments.map((a) => ({ name: a.name })),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setAttachments([]);
    setLoading(true);
    setError(null);

    try {
      const res = await sendVaultChatMessage({
        chatId: activeChatId,
        prompt: userText,
        mode,
        attachments: userAttachments,
      });

      if (res?.success) {
        const nextId = res.token || res.chatId;
        if (res.isNewChat || !activeChatId) {
          setActiveChatId(nextId);
          loadChats(false);
        }
        setMessages((prev) => [...prev, res.assistantMessage]);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to connect to Aura Vault engine.');
    } finally {
      setLoading(false);
    }
  };

  const pinnedChats = chats.filter((c) => c.is_pinned);
  const recentChats = chats.filter((c) => !c.is_pinned);
  const currentChatObj = chats.find(
    (c) => c.token === activeChatId || c.id === activeChatId
  );
  const displayUuid = activeChatId ? activeChatId.split('.')[0] : null;

  return (
    <div className="flex h-screen w-screen bg-[#0b0f17] text-slate-100 antialiased font-sans overflow-hidden">
      {/* Sidebar for Cloud Chat History */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-200 border-r border-slate-800/80 bg-[#0e131f] flex flex-col shrink-0 overflow-hidden relative`}
      >
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {loadingChats ? (
            <div className="p-4 text-center text-xs text-slate-500 font-mono">Loading history...</div>
          ) : (
            <>
              {pinnedChats.length > 0 && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1.5">
                    <Pin size={10} />
                    <span>Pinned</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {pinnedChats.map((chat) => {
                      const identifier = chat.token || chat.id;
                      return (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          active={activeChatId === identifier || activeChatId === chat.id}
                          onSelect={() => selectChat(identifier)}
                          onPin={(e) => handleTogglePin(e, identifier)}
                          onDelete={(e) => handleDeleteChat(e, identifier)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Recent Sessions
                </div>
                <div className="space-y-0.5 mt-1">
                  {recentChats.length === 0 && pinnedChats.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-slate-500">No chat history yet.</div>
                  ) : (
                    recentChats.map((chat) => {
                      const identifier = chat.token || chat.id;
                      return (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          active={activeChatId === identifier || activeChatId === chat.id}
                          onSelect={() => selectChat(identifier)}
                          onPin={(e) => handleTogglePin(e, identifier)}
                          onDelete={(e) => handleDeleteChat(e, identifier)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Database Engine Status Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-emerald-400" />
            <span>PostgreSQL UUID</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
        </div>
      </aside>

      {/* Main Studio */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 px-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles size={16} />
              </div>
              <h1 className="text-sm font-semibold text-white tracking-tight">Aura Vault</h1>

              {displayUuid && (
                <button
                  onClick={handleCopyChatId}
                  title="Click to copy UUID"
                  className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition"
                >
                  <Hash size={11} className="text-indigo-400" />
                  <span>{displayUuid.slice(0, 8)}...{displayUuid.slice(-4)}</span>
                  {copiedId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              )}
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMode('mini')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                mode === 'mini' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Flash (Mini)
            </button>
            <button
              type="button"
              onClick={() => setMode('pro')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                mode === 'pro' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reasoning (Pro)
            </button>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Aura Vault Ready</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Ask architectural questions, debug code, or attach files. Sessions use secure UUID primary keys in PostgreSQL.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {msg.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {msg.attachments.map((file, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md text-slate-300 flex items-center gap-1"
                          >
                            <Paperclip size={10} className="text-indigo-400" />
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-200 vault-markdown'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      )}
                    </div>

                    {!isUser && msg.modelTier && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1 font-mono">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span>Engine: {msg.modelTier === 'pro' ? 'Aura Pro' : 'Aura Mini'}</span>
                        {msg.isFailOver && <span className="text-amber-400 font-sans">(Backup)</span>}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-3 justify-start items-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 animate-pulse">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-slate-900/90 border border-slate-800 flex items-center min-h-[40px]">
                <div className="flex items-center gap-1 h-3">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </main>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="max-w-4xl w-full mx-auto px-4 py-2 flex gap-2 border-t border-slate-800/60 bg-slate-900/40 overflow-x-auto">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs text-slate-300"
              >
                <Paperclip size={12} className="text-indigo-400" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-rose-400 ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <footer className="p-4 border-t border-slate-800/80 bg-slate-900/40 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2.5">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-30"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={loading ? 'Aura Vault is responding...' : 'Ask Aura Vault, debug code, or attach files...'}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />

            <button
              type="submit"
              disabled={loading || (!input.trim() && attachments.length === 0)}
              className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-500 transition"
            >
              <Send size={16} />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

function ChatItem({ chat, active, onSelect, onPin, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
        active
          ? 'bg-slate-800/90 text-white font-medium shadow-sm border border-indigo-500/30'
          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 truncate pr-2">
        <MessageSquare size={13} className={active ? 'text-indigo-400' : 'text-slate-500'} />
        <span className="truncate">{chat.title}</span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPin}
          title={chat.is_pinned ? 'Unpin' : 'Pin'}
          className="p-1 text-slate-400 hover:text-indigo-400 rounded transition"
        >
          {chat.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
        </button>
        <button
          onClick={onDelete}
          title="Delete Chat"
          className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}