import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import API from './api/axios';
import AuthPage from './pages/AuthPage';
import UserProfile from './components/UserProfile';
import AuraVault from './components/vault/AuraVault';
import { Sparkles, Database, Terminal, Shield, ArrowUpRight } from 'lucide-react';

function Dashboard({ user, onLogout }) {
  const workspaceApps = [
    {
      id: 'vault',
      title: 'Aura Vault',
      subtitle: 'AI Developer Assistant',
      desc: 'Multimodal code reasoning & workspace assistant powered by Gemini.',
      icon: Sparkles,
      gradient: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
      active: true,
      onClick: () => window.open('/vault', '_blank', 'noopener,noreferrer'),
    },
    {
      id: 'db',
      title: 'Data Engine',
      subtitle: 'Schema Studio',
      desc: 'PostgreSQL visual modeling and query sandbox.',
      icon: Database,
      gradient: 'from-sky-500/10 to-blue-500/10 text-sky-400 border-slate-800',
      active: false,
    },
    {
      id: 'terminal',
      title: 'Cloud Shell',
      subtitle: 'Container CLI',
      desc: 'Isolated execution environment for fast prototyping.',
      icon: Terminal,
      gradient: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-slate-800',
      active: false,
    },
    {
      id: 'sentinel',
      title: 'API Sentinel',
      subtitle: 'Security & Health',
      desc: 'Continuous endpoint monitoring and JWT policy audit.',
      icon: Shield,
      gradient: 'from-amber-500/10 to-orange-500/10 text-amber-400 border-slate-800',
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-14 border-b border-slate-800/80 bg-[#0b0f17]/70 backdrop-blur-lg px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          <span className="font-semibold text-sm tracking-tight text-white">Aura Workspace</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">v1.0</span>
        </div>

        <UserProfile user={user} onLogout={onLogout} />
      </header>

      {/* Workspace Hub */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="mb-10 space-y-1 text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Workspace Dashboard</h2>
          <p className="text-sm text-slate-400">Launch a micro-tool in a separate window or tab.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaceApps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                onClick={app.active ? app.onClick : undefined}
                className={`group relative p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  app.active
                    ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/90 cursor-pointer shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5'
                    : 'bg-slate-900/20 border-slate-800/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br border ${app.gradient}`}>
                      <Icon size={20} />
                    </div>
                    {app.active ? (
                      <div className="w-7 h-7 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-indigo-300 group-hover:border-indigo-500/30 transition">
                        <ArrowUpRight size={14} />
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Soon
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base text-slate-100 mb-0.5 group-hover:text-white transition">
                    {app.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-2">{app.subtitle}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{app.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const res = await API.get('/users/me');
        if (res.data?.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        if (err.response?.status !== 401) {
          console.error('Session Check Error:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await API.post('/users/logout');
      if (res.data?.success) {
        setUser(null);
      }
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0b0f17]">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4">
              <AuthPage onLoginSuccess={(userData) => setUser(userData)} />
            </div>
          ) : (
            <Dashboard user={user} onLogout={handleLogout} />
          )
        }
      />
      <Route path="/vault" element={<AuraVault />} />
    </Routes>
  );
}