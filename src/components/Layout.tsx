import { Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Calendar, Users, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import { cn } from '../lib/utils';
import { useStore } from '../store';

export default function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { mySchedule, myShareCode, partnerCode, setPartnerCode, setPartnerSchedule } = useStore();

  // Handle partner code from URL
  useEffect(() => {
    const partner = searchParams.get('partner');
    if (partner) {
      setPartnerCode(partner);
      setSearchParams({});
      if (window.location.pathname === '/') {
        navigate('/couple', { replace: true });
      }
    }
  }, [searchParams, navigate, setPartnerCode, setSearchParams]);

  // Push local changes to server for real-time sync
  useEffect(() => {
    if (myShareCode) {
      fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: myShareCode, data: mySchedule })
      }).catch(console.error);
    }
  }, [mySchedule, myShareCode]);

  // WebSocket for real-time updates from partner
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      const ids = [];
      if (myShareCode) ids.push(myShareCode);
      if (partnerCode) ids.push(partnerCode);
      if (ids.length > 0) {
        ws.send(JSON.stringify({ type: 'subscribe', ids }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'update' && msg.id === partnerCode) {
          setPartnerSchedule(msg.data);
        }
      } catch (e) {}
    };

    return () => ws.close();
  }, [myShareCode, partnerCode, setPartnerSchedule]);

  const isCoupleMode = location.pathname === '/couple';

  return (
    <div className="h-screen h-[100dvh] text-stone-900 font-sans flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="glass-header px-4 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/90 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            S
          </div>
          <h1 className="text-xl font-semibold tracking-tight">同步课表</h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-stone-600 hover:bg-stone-200/50 rounded-xl transition-colors"
          title="设置"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet />
      </main>

      {/* Floating Action Button for Mode Switch */}
      <button
        onClick={() => navigate(isCoupleMode ? '/' : '/couple')}
        className="absolute bottom-6 right-6 z-30 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500/90 backdrop-blur-md text-white rounded-full shadow-lg border border-white/20 hover:bg-emerald-600/90 hover:scale-105 active:scale-95 transition-all"
      >
        {isCoupleMode ? (
          <>
            <Calendar className="w-5 h-5" />
            <span className="font-medium">我的课表</span>
          </>
        ) : (
          <>
            <Users className="w-5 h-5" />
            <span className="font-medium">情侣课表</span>
          </>
        )}
      </button>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
