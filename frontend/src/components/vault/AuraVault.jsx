import React, { useState, useRef, useEffect } from 'react';
import { generateVaultPrompt } from '../../api/vaultApi';
import { Send, Paperclip, Sparkles, AlertCircle, Trash2, Bot, User, CheckCircle2 } from 'lucide-react';

export default function AuraVault() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am Aura Vault. How can I assist your development workflow today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('mini');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

    const userMessage = {
      role: 'user',
      text: input.trim(),
      attachments: [...attachments],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setLoading(true);
    setError(null);

    try {
      const historyPayload = messages.slice(-6).map((msg) => ({
        role: msg.role,
        text: msg.text,
      }));

      const res = await generateVaultPrompt({
        prompt: userMessage.text,
        mode,
        attachments: userMessage.attachments,
        conversationHistory: historyPayload,
      });

      if (res?.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.text,
            modelUsed: res.data.modelName,
            isFailOver: res.data.isFailOver,
            notice: res.data.notice,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to connect to Aura Vault engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f17] text-slate-100 antialiased font-sans">
      {/* Studio Header */}
      <header className="h-14 px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">Aura Vault</h1>
            <p className="text-[11px] text-slate-400 font-mono">Autonomous AI Copilot</p>
          </div>
        </div>

        {/* Engine Switcher */}
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

      {/* Message Feed */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-6">
        {messages.map((msg, i) => {
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
                      <span key={idx} className="text-[11px] bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-md text-slate-300 flex items-center gap-1">
                        <Paperclip size={10} className="text-indigo-400" />
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm'
                  }`}
                >
                  {msg.text}

                  {msg.notice && (
                    <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-xs text-amber-400 flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      <span>{msg.notice}</span>
                    </div>
                  )}
                </div>

                {msg.modelUsed && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1">
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span>Engine: {msg.modelUsed}</span>
                    {msg.isFailOver && <span className="text-amber-400">(Backup)</span>}
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
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-11 font-mono">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Aura Vault is thinking...
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
            <div key={i} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs text-slate-300">
              <Paperclip size={12} className="text-indigo-400" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-rose-400 ml-1">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/40 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2.5">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aura Vault, analyze errors, or paste code..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />

          <button
            type="submit"
            disabled={loading || (!input.trim() && attachments.length === 0)}
            className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition"
          >
            <Send size={16} />
          </button>
        </form>
      </footer>
    </div>
  );
}