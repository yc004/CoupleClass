import { useState, useEffect } from 'react';
import { useStore } from '../store';
import ScheduleGrid from '../components/ScheduleGrid';
import { Share2, Link as LinkIcon, AlertCircle, Loader2, Users } from 'lucide-react';

export default function CouplePage() {
  const { mySchedule, partnerSchedule, setPartnerSchedule, myShareCode, setMyShareCode, partnerCode, setPartnerCode } = useStore();
  
  const [inputCode, setInputCode] = useState(partnerCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Generate my share code and save to backend
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const id = myShareCode || Math.random().toString(36).substring(2, 8).toUpperCase();
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data: mySchedule })
      });
      if (res.ok) {
        setMyShareCode(id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  // Load partner schedule
  const loadPartner = async (code: string) => {
    if (!code) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/schedules/${code}`);
      if (!res.ok) throw new Error('未找到课表');
      const { data } = await res.json();
      setPartnerSchedule(data);
      setPartnerCode(code);
    } catch (err) {
      setError('无法加载伴侣课表，请检查邀请码。');
      setPartnerSchedule(null);
      setPartnerCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (partnerCode && !partnerSchedule) {
      loadPartner(partnerCode);
    }
  }, [partnerCode]);

  const copyLink = () => {
    if (!myShareCode) return;
    const url = `${window.location.origin}/couple?partner=${myShareCode}`;
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板！');
  };

  return (
    <div className="h-full p-2 md:p-8 flex flex-col gap-3 md:gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 px-1 md:px-0 shrink-0">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-stone-800 tracking-tight">情侣课表</h1>
          <p className="hidden md:block text-stone-500 text-sm mt-1">绑定伴侣，实时同步课表并寻找共同空闲时间</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {!myShareCode ? (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500 text-white text-sm md:text-base font-medium rounded-xl hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              分享我的课表
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1 pr-3 shadow-sm">
              <button
                onClick={copyLink}
                className="p-1.5 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors"
                title="复制链接"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <span className="text-xs md:text-sm font-mono font-medium text-stone-600">邀请码: {myShareCode}</span>
            </div>
          )}
        </div>
      </div>

      {!partnerSchedule ? (
        <div className="flex-1 flex items-center justify-center p-2">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-stone-800 mb-2">连接伴侣课表</h2>
            <p className="text-stone-500 text-sm mb-6">
              输入TA的邀请码，或让TA发送链接给你，即可实时同步你们的课表。
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="输入6位邀请码"
                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase text-center min-w-0"
                maxLength={6}
              />
              <button
                onClick={() => loadPartner(inputCode)}
                disabled={isLoading || inputCode.length < 6}
                className="px-4 md:px-6 py-2 bg-stone-800 text-white font-medium rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50 shrink-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '连接'}
              </button>
            </div>
            {error && (
              <div className="mt-4 flex items-center justify-center gap-2 text-rose-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-2 md:gap-4">
          <div className="flex flex-wrap items-center justify-between bg-white p-2 md:p-4 rounded-xl md:rounded-2xl border border-stone-200 shadow-sm gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                <span className="text-[10px] md:text-sm font-medium text-stone-600">我的课程</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-100 border border-stone-300" />
                <span className="text-[10px] md:text-sm font-medium text-stone-600">TA的课程</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-200" />
                <span className="text-[10px] md:text-sm font-medium text-stone-600">共同空闲</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-300" />
                <span className="text-[10px] md:text-sm font-medium text-stone-600">一起上课</span>
              </div>
            </div>
            <button
              onClick={() => {
                setPartnerSchedule(null);
                setPartnerCode(null);
              }}
              className="text-[10px] md:text-sm text-stone-500 hover:text-stone-800 transition-colors ml-auto"
            >
              断开连接
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ScheduleGrid
              courses={mySchedule.courses}
              partnerCourses={partnerSchedule.courses}
              mode="couple"
            />
          </div>
        </div>
      )}
    </div>
  );
}
