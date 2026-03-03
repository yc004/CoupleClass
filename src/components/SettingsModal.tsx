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

  // 处理时间变化，自动调整后续课程时间
  const handleTimeChange = (index: number, newTime: string) => {
    if (!localSettings.periodTimes || !newTime) return;

    const newTimes = [...localSettings.periodTimes];
    const oldTime = newTimes[index];
    
    // 如果是第一次设置时间或时间为空，直接设置
    if (!oldTime) {
      newTimes[index] = newTime;
      setLocalSettings({ ...localSettings, periodTimes: newTimes });
      return;
    }

    // 计算时间差（分钟）
    const [oldHours, oldMinutes] = oldTime.split(':').map(Number);
    const [newHours, newMinutes] = newTime.split(':').map(Number);
    const oldTotalMinutes = oldHours * 60 + oldMinutes;
    const newTotalMinutes = newHours * 60 + newMinutes;
    const timeDiff = newTotalMinutes - oldTotalMinutes;

    // 更新当前时间
    newTimes[index] = newTime;

    // 自动调整后续所有课程时间
    for (let i = index + 1; i < localSettings.totalPeriods; i++) {
      if (newTimes[i]) {
        const [h, m] = newTimes[i].split(':').map(Number);
        const totalMinutes = h * 60 + m + timeDiff;
        const adjustedHours = Math.floor(totalMinutes / 60) % 24;
        const adjustedMinutes = totalMinutes % 60;
        newTimes[i] = `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
      }
    }

    setLocalSettings({ ...localSettings, periodTimes: newTimes });
  };

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="flat-modal rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">课表设置</h2>
          <button onClick={onClose} className="flat-button p-2 rounded-xl">
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 学期设置 */}
          <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">学期设置</h3>
            
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">开学日期</label>
              <input
                type="date"
                value={localSettings.semesterStartDate || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, semesterStartDate: e.target.value })}
                className="flat-input w-full px-4 py-3 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">总教学周数</label>
              <input
                type="number"
                min="1"
                max="52"
                value={localSettings.totalWeeks || 20}
                onChange={(e) => setLocalSettings({ ...localSettings, totalWeeks: parseInt(e.target.value) || 20 })}
                className="flat-input w-full px-4 py-3 rounded-xl"
              />
            </div>
          </div>

          {/* Show Weekends */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">显示周末</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">在课表中显示周六和周日</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, showWeekends: !localSettings.showWeekends })}
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                localSettings.showWeekends ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full bg-white absolute top-1 transition-transform shadow-md",
                localSettings.showWeekends ? "translate-x-7" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* Show Non-Current Week Courses */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">显示非本周课程</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">以灰色显示不在本周上课的课程</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, showNonCurrentWeekCourses: !localSettings.showNonCurrentWeekCourses })}
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                localSettings.showNonCurrentWeekCourses ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full bg-white absolute top-1 transition-transform shadow-md",
                localSettings.showNonCurrentWeekCourses ? "translate-x-7" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* Total Periods */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">每日总节数</label>
            <input
              type="number"
              min="1"
              max="20"
              value={localSettings.totalPeriods}
              onChange={(e) => setLocalSettings({ ...localSettings, totalPeriods: parseInt(e.target.value) || 12 })}
              className="flat-input w-full px-4 py-3 rounded-xl"
            />
          </div>

          {/* Custom Period Times Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">自定义每节课时间</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">单独设置每一节课的开始时间</p>
            </div>
            <button
              onClick={() => {
                const isCustom = !!localSettings.periodTimes && localSettings.periodTimes.length > 0;
                if (isCustom) {
                  setLocalSettings({ ...localSettings, periodTimes: [] });
                } else {
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
                "w-14 h-8 rounded-full transition-all relative shrink-0",
                (localSettings.periodTimes && localSettings.periodTimes.length > 0) ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full bg-white absolute top-1 transition-transform shadow-md",
                (localSettings.periodTimes && localSettings.periodTimes.length > 0) ? "translate-x-7" : "translate-x-1"
              )} />
            </button>
          </div>

          {localSettings.periodTimes && localSettings.periodTimes.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              <div className="mb-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  💡 提示：调整某一节课的时间后，后面的所有课程会自动跟随调整
                </p>
              </div>
              {Array.from({ length: localSettings.totalPeriods }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-12">第 {i + 1} 节</span>
                  <input
                    type="time"
                    value={localSettings.periodTimes![i] || ''}
                    onChange={(e) => handleTimeChange(i, e.target.value)}
                    className="flat-input flex-1 px-3 py-2 rounded-lg"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">每节课时长（分钟）</label>
                <input
                  type="number"
                  min="10"
                  max="180"
                  value={localSettings.classDuration}
                  onChange={(e) => setLocalSettings({ ...localSettings, classDuration: parseInt(e.target.value) || 45 })}
                  className="flat-input w-full px-4 py-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">课间休息（分钟）</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={localSettings.breakDuration}
                  onChange={(e) => setLocalSettings({ ...localSettings, breakDuration: parseInt(e.target.value) || 10 })}
                  className="flat-input w-full px-4 py-3 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">第一节课开始时间</label>
                <input
                  type="time"
                  value={localSettings.startTime}
                  onChange={(e) => setLocalSettings({ ...localSettings, startTime: e.target.value })}
                  className="flat-input w-full px-4 py-3 rounded-xl"
                />
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="flat-button px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 font-semibold rounded-xl text-white shadow-md hover:shadow-lg transition-all hover:scale-105 bg-emerald-500 hover:bg-emerald-600"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
}
