import { Outlet, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Calendar, Users, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import { cn } from '../lib/utils';
import { useStore } from '../store';

export default function Layout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  return (
    <div className="h-screen h-[100dvh] bg-stone-50 text-stone-900 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <h1 className="text-xl font-semibold tracking-tight">同步课表</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-10 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar / Mobile Menu */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-stone-200 p-4 flex flex-col gap-2 transition-transform duration-300 ease-in-out md:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex items-center gap-2 px-2 py-4 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <h1 className="text-xl font-semibold tracking-tight">同步课表</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-1 mt-14 md:mt-0">
          <NavLink
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
              }`
            }
          >
            <Calendar className="w-5 h-5" />
            我的课表
          </NavLink>
          <NavLink
            to="/couple"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
              }`
            }
          >
            <Users className="w-5 h-5" />
            情侣课表
          </NavLink>
        </nav>

        <button
          onClick={() => {
            setIsSettingsOpen(true);
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors mt-auto"
        >
          <SettingsIcon className="w-5 h-5" />
          设置
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-stone-50/50 flex flex-col relative">
        <Outlet />
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
