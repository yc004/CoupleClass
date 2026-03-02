import { useStore } from '../store';
import { Course } from '../types';
import { cn } from '../lib/utils';

interface ScheduleGridProps {
  courses: Course[];
  partnerCourses?: Course[];
  mode: 'single' | 'couple';
  onAddCourse?: (day: number, period: number) => void;
  onEditCourse?: (course: Course) => void;
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

export default function ScheduleGrid({ courses, partnerCourses = [], mode, onAddCourse, onEditCourse }: ScheduleGridProps) {
  const { mySchedule: { settings } } = useStore();
  const days = settings.showWeekends ? 7 : 5;
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const getPeriodTime = (period: number) => {
    if (settings.periodTimes && settings.periodTimes[period - 1]) {
      return settings.periodTimes[period - 1];
    }
    const [hours, minutes] = settings.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (period - 1) * (settings.classDuration + settings.breakDuration);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="grid border-b border-stone-200 bg-stone-50/80" style={{ gridTemplateColumns: `60px repeat(${days}, minmax(0, 1fr))` }}>
        <div className="p-3 text-center text-xs font-medium text-stone-400 uppercase tracking-wider border-r border-stone-200">
          时间
        </div>
        {Array.from({ length: days }).map((_, i) => (
          <div key={i} className="p-3 text-center text-sm font-semibold text-stone-700 border-r border-stone-200 last:border-r-0">
            {dayNames[i]}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative">
        <div 
          className="grid" 
          style={{ 
            gridTemplateColumns: `60px repeat(${days}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${settings.totalPeriods}, minmax(80px, auto))`
          }}
        >
          {/* Background Grid Lines & Time Column */}
          {Array.from({ length: settings.totalPeriods }).map((_, r) => (
            <div key={`row-${r}`} className="contents">
              <div className="border-b border-r border-stone-200 bg-stone-50/30 flex flex-col items-center justify-center p-1" style={{ gridColumn: 1, gridRow: r + 1 }}>
                <span className="text-xs font-bold text-stone-700">{r + 1}</span>
                <span className="text-[10px] text-stone-400">{getPeriodTime(r + 1)}</span>
              </div>
              {Array.from({ length: days }).map((_, c) => (
                <div 
                  key={`cell-${r}-${c}`} 
                  className="border-b border-r border-stone-100 hover:bg-stone-50/50 cursor-pointer transition-colors group relative"
                  style={{ gridColumn: c + 2, gridRow: r + 1 }}
                  onClick={() => mode === 'single' && onAddCourse?.(c + 1, r + 1)}
                >
                  {mode === 'single' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-stone-200/50 flex items-center justify-center text-stone-500">
                        +
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Courses (Absolute/Grid Placed) */}
          {mode === 'single' ? (
            courses.map(course => {
              if (course.dayOfWeek > days) return null;
              const span = course.endPeriod - course.startPeriod + 1;
              return (
                <div
                  key={course.id}
                  className={cn(
                    "m-1 p-2 rounded-xl border shadow-sm cursor-pointer transition-transform hover:scale-[1.02] flex flex-col gap-1 overflow-hidden z-10",
                    course.color || COLORS[0]
                  )}
                  style={{ 
                    gridColumn: course.dayOfWeek + 1, 
                    gridRow: `${course.startPeriod} / span ${span}` 
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCourse?.(course);
                  }}
                >
                  <div className="font-semibold text-sm leading-tight line-clamp-2">{course.name}</div>
                  <div className="text-xs opacity-80 mt-auto flex flex-col gap-0.5">
                    <span className="truncate">📍 {course.location}</span>
                    <span className="truncate">👨‍🏫 {course.teacher}</span>
                  </div>
                </div>
              );
            })
          ) : (
            // Couple Mode Rendering
            <>
              {/* Background Free Cells */}
              {Array.from({ length: days }).map((_, c) => {
                return Array.from({ length: settings.totalPeriods }).map((_, r) => {
                  const day = c + 1;
                  const period = r + 1;
                  const myCourse = courses.find(course => course.dayOfWeek === day && period >= course.startPeriod && period <= course.endPeriod);
                  const partnerCourse = partnerCourses.find(course => course.dayOfWeek === day && period >= course.startPeriod && period <= course.endPeriod);

                  if (!myCourse && !partnerCourse) {
                    return (
                      <div 
                        key={`couple-free-${day}-${period}`}
                        className="m-1 rounded-xl bg-emerald-50/50 border border-emerald-100/50 flex items-center justify-center pointer-events-none z-0"
                        style={{ gridColumn: day + 1, gridRow: period }}
                      >
                        <span className="text-[10px] font-medium text-emerald-600/40 uppercase tracking-wider">共同空闲</span>
                      </div>
                    );
                  }
                  return null;
                });
              })}

              {/* Together Courses */}
              {courses.map(myCourse => {
                if (myCourse.dayOfWeek > days) return null;
                const partnerCourse = partnerCourses.find(c => c.dayOfWeek === myCourse.dayOfWeek && c.startPeriod === myCourse.startPeriod && c.endPeriod === myCourse.endPeriod && c.name === myCourse.name);
                if (partnerCourse) {
                  const span = myCourse.endPeriod - myCourse.startPeriod + 1;
                  return (
                    <div
                      key={`together-${myCourse.id}`}
                      className="m-1 p-2 rounded-xl bg-purple-100 border border-purple-200 flex flex-col justify-center items-center text-center z-10 shadow-sm"
                      style={{ gridColumn: myCourse.dayOfWeek + 1, gridRow: `${myCourse.startPeriod} / span ${span}` }}
                    >
                      <span className="text-xs font-bold text-purple-800 mb-1">一起上课！✨</span>
                      <span className="text-xs font-semibold text-purple-700 line-clamp-2">{myCourse.name}</span>
                      <span className="text-[10px] text-purple-600 mt-1">📍 {myCourse.location}</span>
                    </div>
                  );
                }
                return null;
              })}

              {/* My Courses (Not Together) */}
              {courses.map(myCourse => {
                if (myCourse.dayOfWeek > days) return null;
                const partnerCourse = partnerCourses.find(c => c.dayOfWeek === myCourse.dayOfWeek && c.startPeriod === myCourse.startPeriod && c.endPeriod === myCourse.endPeriod && c.name === myCourse.name);
                if (partnerCourse) return null;

                const span = myCourse.endPeriod - myCourse.startPeriod + 1;
                return (
                  <div
                    key={`my-${myCourse.id}`}
                    className={cn(
                      "m-1 p-1.5 rounded-lg border shadow-sm flex flex-col gap-0.5 overflow-hidden z-10",
                      myCourse.color || COLORS[0]
                    )}
                    style={{ 
                      gridColumn: myCourse.dayOfWeek + 1, 
                      gridRow: `${myCourse.startPeriod} / span ${span}`,
                      justifySelf: 'start',
                      width: 'calc(50% - 4px)'
                    }}
                  >
                    <div className="font-bold text-[10px] leading-tight truncate">我: {myCourse.name}</div>
                    <div className="text-[10px] opacity-80 truncate">{myCourse.location}</div>
                  </div>
                );
              })}

              {/* Partner Courses (Not Together) */}
              {partnerCourses.map(partnerCourse => {
                if (partnerCourse.dayOfWeek > days) return null;
                const myCourse = courses.find(c => c.dayOfWeek === partnerCourse.dayOfWeek && c.startPeriod === partnerCourse.startPeriod && c.endPeriod === partnerCourse.endPeriod && c.name === partnerCourse.name);
                if (myCourse) return null;

                const span = partnerCourse.endPeriod - partnerCourse.startPeriod + 1;
                return (
                  <div
                    key={`partner-${partnerCourse.id}`}
                    className="m-1 p-1.5 rounded-lg border bg-stone-100 text-stone-700 border-stone-200 shadow-sm flex flex-col gap-0.5 overflow-hidden z-10"
                    style={{ 
                      gridColumn: partnerCourse.dayOfWeek + 1, 
                      gridRow: `${partnerCourse.startPeriod} / span ${span}`,
                      justifySelf: 'end',
                      width: 'calc(50% - 4px)'
                    }}
                  >
                    <div className="font-bold text-[10px] leading-tight truncate">TA: {partnerCourse.name}</div>
                    <div className="text-[10px] opacity-80 truncate">{partnerCourse.location}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
