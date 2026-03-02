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
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        location: '',
        teacher: '',
        dayOfWeek: 1,
        startPeriod: 1,
        endPeriod: 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        ...initialData,
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const courseData = formData as Omit<Course, 'id'>;
    
    // Ensure end period is >= start period
    if (courseData.endPeriod < courseData.startPeriod) {
      courseData.endPeriod = courseData.startPeriod;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-xl font-semibold text-stone-800">
            {courseId ? 'Edit Course' : 'Add Course'}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block font-medium text-stone-800 mb-1 text-sm">Course Name *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="e.g. Advanced Mathematics"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-800 mb-1 text-sm">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="e.g. Room 101"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-800 mb-1 text-sm">Teacher</label>
              <input
                type="text"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="e.g. Dr. Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-stone-800 mb-1 text-sm">Day</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <option key={i} value={i + 1}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-stone-800 mb-1 text-sm">Start Period</label>
              <select
                value={formData.startPeriod}
                onChange={(e) => setFormData({ ...formData, startPeriod: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {Array.from({ length: settings.totalPeriods }).map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-stone-800 mb-1 text-sm">End Period</label>
              <select
                value={formData.endPeriod}
                onChange={(e) => setFormData({ ...formData, endPeriod: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {Array.from({ length: settings.totalPeriods }).map((_, i) => (
                  <option key={i} value={i + 1} disabled={i + 1 < (formData.startPeriod || 1)}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-800 mb-2 text-sm">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform",
                    color.split(' ')[0], // Get bg color
                    formData.color === color ? "scale-110 border-stone-800 shadow-sm" : "border-transparent hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-stone-100">
            {courseId ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-stone-600 font-medium hover:bg-stone-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-xl shadow-sm transition-colors text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
