import { X, Trash2 } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { Course } from '../types';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Course>;
  courseId?: string;
}

const COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
];

export default function CourseModal({ isOpen, onClose, initialData, courseId }: CourseModalProps) {
  const { addCourse, updateCourse, deleteCourse, mySchedule: { settings } } = useStore();
  
  const [formData, setFormData] = useState<Partial<Course>>({
    name: '',
    location: '',
    teacher: '',
    dayOfWeek: 1,
    startPeriod: 1,
    endPeriod: 2,
    color: COLORS[0],
    weekType: 'all',
    customWeeks: [],
  });

  const [customWeeksInput, setCustomWeeksInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const data = {
        name: '',
        location: '',
        teacher: '',
        dayOfWeek: 1,
        startPeriod: 1,
        endPeriod: 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        weekType: 'all' as const,
        customWeeks: [],
        ...initialData,
      };
      setFormData(data);
      
      // 设置自定义周数输入框的值
      if (data.weekType === 'custom' && data.customWeeks && data.customWeeks.length > 0) {
        setCustomWeeksInput(data.customWeeks.join(','));
      } else {
        setCustomWeeksInput('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const courseData = { ...formData } as Omit<Course, 'id'>;
    
    if (courseData.endPeriod < courseData.startPeriod) {
      courseData.endPeriod = courseData.startPeriod;
    }

    // 处理自定义周数
    if (courseData.weekType === 'custom') {
      if (customWeeksInput.trim()) {
        const weeks = customWeeksInput
          .split(',')
          .map(w => parseInt(w.trim()))
          .filter(w => !isNaN(w) && w > 0)
          .sort((a, b) => a - b);
        courseData.customWeeks = weeks.length > 0 ? weeks : [];
      } else {
        courseData.customWeeks = [];
      }
    } else {
      courseData.customWeeks = [];
    }

    if (courseId) {
      updateCourse(courseId, courseData);
    } else {
      addCourse(courseData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (courseId) {
      deleteCourse(courseId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="flat-modal rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {courseId ? '编辑课程' : '添加课程'}
          </h2>
          <button onClick={onClose} className="flat-button p-2 rounded-xl">
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">课程名称 *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="例如：高等数学"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">上课地点</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="教学楼101"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">授课教师</label>
              <input
                type="text"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="张老师"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">星期</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100"
              >
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => (
                  <option key={i} value={i + 1} className="bg-white dark:bg-slate-800">{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">开始节次</label>
              <select
                value={formData.startPeriod}
                onChange={(e) => setFormData({ ...formData, startPeriod: parseInt(e.target.value) })}
                className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100"
              >
                {Array.from({ length: settings.totalPeriods }).map((_, i) => (
                  <option key={i} value={i + 1} className="bg-white dark:bg-slate-800">{i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">结束节次</label>
              <select
                value={formData.endPeriod}
                onChange={(e) => setFormData({ ...formData, endPeriod: parseInt(e.target.value) })}
                className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100"
              >
                {Array.from({ length: settings.totalPeriods }).map((_, i) => (
                  <option key={i} value={i + 1} disabled={i + 1 < (formData.startPeriod || 1)} className="bg-white dark:bg-slate-800">{i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 上课周数 */}
          <div>
            <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">上课周数</label>
            <select
              value={formData.weekType || 'all'}
              onChange={(e) => setFormData({ ...formData, weekType: e.target.value as 'all' | 'odd' | 'even' | 'custom' })}
              className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100 mb-3"
            >
              <option value="all" className="bg-white dark:bg-slate-800">每周</option>
              <option value="odd" className="bg-white dark:bg-slate-800">单周（1,3,5...）</option>
              <option value="even" className="bg-white dark:bg-slate-800">双周（2,4,6...）</option>
              <option value="custom" className="bg-white dark:bg-slate-800">自定义</option>
            </select>

            {formData.weekType === 'custom' && (
              <div>
                <input
                  type="text"
                  value={customWeeksInput}
                  onChange={(e) => setCustomWeeksInput(e.target.value)}
                  placeholder="输入周数，用逗号分隔，如：1,3,5,7"
                  className="flat-input w-full px-4 py-3 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">例如：1,3,5,7 表示第1、3、5、7周上课</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
              {courseId ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-red-200 dark:border-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flat-button px-6 py-3 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-sm"
                >
                  保存
                </button>
              </div>
            </div>
        </form>
      </div>
    </div>
  );
}
