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
          <h2 className="text-xl font-semibold text-stone-800">Schedule Settings</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Show Weekends */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-stone-800">Show Weekends</h3>
              <p className="text-sm text-stone-500">Display Saturday and Sunday</p>
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
            <label className="block font-medium text-stone-800 mb-1">Total Periods per Day</label>
            <input
              type="number"
              min="1"
              max="20"
              value={localSettings.totalPeriods}
              onChange={(e) => setLocalSettings({ ...localSettings, totalPeriods: parseInt(e.target.value) || 12 })}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Class Duration */}
          <div>
            <label className="block font-medium text-stone-800 mb-1">Class Duration (minutes)</label>
            <input
              type="number"
              min="10"
              max="180"
              value={localSettings.classDuration}
              onChange={(e) => setLocalSettings({ ...localSettings, classDuration: parseInt(e.target.value) || 45 })}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block font-medium text-stone-800 mb-1">First Class Start Time</label>
            <input
              type="time"
              value={localSettings.startTime}
              onChange={(e) => setLocalSettings({ ...localSettings, startTime: e.target.value })}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-stone-600 font-medium hover:bg-stone-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-xl shadow-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
