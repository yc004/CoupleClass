import { X } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mySchedule: { settings }, updateSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-xl font-semibold text-stone-800">课表设置</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Show Weekends */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-stone-800">显示周末</h3>
              <p className="text-sm text-stone-500">在课表中显示周六和周日</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, showWeekends: !localSettings.showWeekends })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                localSettings.showWeekends ? "bg-emerald-500" : "bg-stone-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                localSettings.showWeekends ? "translate-x-7" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* Total Periods */}
          <div>
            <label className="block font-medium text-stone-800 mb-1">每日总节数</label>
            <input
              type="number"
              min="1"
              max="20"
              value={localSettings.totalPeriods}
              onChange={(e) => setLocalSettings({ ...localSettings, totalPeriods: parseInt(e.target.value) || 12 })}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Custom Period Times Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <div>
              <h3 className="font-medium text-stone-800">自定义每节课时间</h3>
              <p className="text-sm text-stone-500">单独设置每一节课的开始时间</p>
            </div>
            <button
              onClick={() => {
                const isCustom = !!localSettings.periodTimes && localSettings.periodTimes.length > 0;
                if (isCustom) {
                  setLocalSettings({ ...localSettings, periodTimes: [] });
                } else {
                  // Generate default period times based on current settings
                  const times = Array.from({ length: localSettings.totalPeriods }).map((_, i) => {
                    const [hours, minutes] = localSettings.startTime.split(':').map(Number);
                    const totalMinutes = hours * 60 + minutes + i * (localSettings.classDuration + localSettings.breakDuration);
                    const h = Math.floor(totalMinutes / 60) % 24;
                    const m = totalMinutes % 60;
                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                  });
                  setLocalSettings({ ...localSettings, periodTimes: times });
                }
              }}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative shrink-0",
                (localSettings.periodTimes && localSettings.periodTimes.length > 0) ? "bg-emerald-500" : "bg-stone-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                (localSettings.periodTimes && localSettings.periodTimes.length > 0) ? "translate-x-7" : "translate-x-1"
              )} />
            </button>
          </div>

          {localSettings.periodTimes && localSettings.periodTimes.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {Array.from({ length: localSettings.totalPeriods }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-500 w-12">第 {i + 1} 节</span>
                  <input
                    type="time"
                    value={localSettings.periodTimes![i] || ''}
                    onChange={(e) => {
                      const newTimes = [...localSettings.periodTimes!];
                      newTimes[i] = e.target.value;
                      setLocalSettings({ ...localSettings, periodTimes: newTimes });
                    }}
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Class Duration */}
              <div>
                <label className="block font-medium text-stone-800 mb-1">每节课时长（分钟）</label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={localSettings.classDuration}
                  onChange={(e) => setLocalSettings({ ...localSettings, classDuration: parseInt(e.target.value) || 45 })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Break Duration */}
              <div>
                <label className="block font-medium text-stone-800 mb-1">课间休息（分钟）</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={localSettings.breakDuration}
                  onChange={(e) => setLocalSettings({ ...localSettings, breakDuration: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block font-medium text-stone-800 mb-1">第一节课开始时间</label>
                <input
                  type="time"
                  value={localSettings.startTime}
                  onChange={(e) => setLocalSettings({ ...localSettings, startTime: e.target.value })}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-stone-600 font-medium hover:bg-stone-200 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-xl shadow-sm transition-colors"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
}
