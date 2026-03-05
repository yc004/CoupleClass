import { Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Calendar, Users, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import { useStore } from '../store';

export default function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, logout, mySchedule, myShareCode, partnerCode, setPartnerCode, setPartnerSchedule } = useStore();

  // 登出处理
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('token');
      logout();
      navigate('/login');
    } catch (err) {
      // 静默处理错误
    }
  };

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
      }).catch(() => {
        // 静默处理错误
      });
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
    <div className="h-screen h-[100dvh] font-sans flex flex-col overflow-hidden relative bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      {/* 全屏课表内容 */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet context={{ setIsSettingsOpen, handleLogout }} />
      </main>

      {/* 浮动模式切换按钮 */}
      <button
        onClick={() => navigate(isCoupleMode ? '/' : '/couple')}
        className="absolute bottom-6 right-6 z-30 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isCoupleMode ? (
          <>
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">我的课表</span>
          </>
        ) : (
          <>
            <Users className="w-5 h-5" />
            <span className="font-semibold">情侣课表</span>
          </>
        )}
      </button>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
