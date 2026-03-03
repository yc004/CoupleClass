import { useStore } from '../store';
import { Course } from '../types';
import { cn } from '../lib/utils';

interface ScheduleGridProps {
  courses: Course[];
  partnerCourses?: Course[];
  mode: 'single' | 'couple';
  onAddCourse?: (day: number, period: number) => void;
  onEditCourse?: (course: Course) => void;
  currentWeek?: number | null; // 当前教学周
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

export default function ScheduleGrid({ courses, partnerCourses = [], mode, onAddCourse, onEditCourse, currentWeek }: ScheduleGridProps) {
  const { mySchedule: { settings } } = useStore();
  const days = settings.showWeekends ? 7 : 5;
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 判断课程是否在本周上课
  const isCourseInCurrentWeek = (course: Course): boolean => {
    if (!currentWeek || !course.weekType || course.weekType === 'all') {
      return true;
    }

    if (course.weekType === 'odd') {
      return currentWeek % 2 === 1;
    }

    if (course.weekType === 'even') {
      return currentWeek % 2 === 0;
    }

    if (course.weekType === 'custom' && course.customWeeks) {
      return course.customWeeks.includes(currentWeek);
    }

    return true;
  };

  // 根据设置过滤或标记课程
  const processedCourses = courses.map(course => ({
    ...course,
    isCurrentWeek: isCourseInCurrentWeek(course)
  }));

  const processedPartnerCourses = partnerCourses.map(course => ({
    ...course,
    isCurrentWeek: isCourseInCurrentWeek(course)
  }));

  // 如果不显示非本周课程，则过滤掉
  const filteredCourses = settings.showNonCurrentWeekCourses 
    ? processedCourses 
    : processedCourses.filter(c => c.isCurrentWeek);
  
  const filteredPartnerCourses = settings.showNonCurrentWeekCourses 
    ? processedPartnerCourses 
    : processedPartnerCourses.filter(c => c.isCurrentWeek);

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

  const getPeriodTimeRange = (period: number) => {
    const startTime = getPeriodTime(period);
    
    // 计算结束时间
    let endMinutes: number;
    if (settings.periodTimes && settings.periodTimes[period - 1]) {
      const [h, m] = startTime.split(':').map(Number);
      endMinutes = h * 60 + m + settings.classDuration;
    } else {
      const [hours, minutes] = settings.startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + (period - 1) * (settings.classDuration + settings.breakDuration);
      endMinutes = totalMinutes + settings.classDuration;
    }
    
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    
    return { startTime, endTime };
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="grid border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 shrink-0" style={{ gridTemplateColumns: `45px repeat(${days}, minmax(0, 1fr))` }}>
        <div className="p-2 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
          节次
        </div>
        {Array.from({ length: days }).map((_, i) => (
          <div key={i} className="p-3 text-center text-sm font-bold text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
            {dayNames[i]}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative">
        <div 
          className="grid" 
          style={{ 
            gridTemplateColumns: `45px repeat(${days}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${settings.totalPeriods}, minmax(80px, auto))`
          }}
        >
          {/* Background Grid Lines & Time Column */}
          {Array.from({ length: settings.totalPeriods }).map((_, r) => {
            const { startTime, endTime } = getPeriodTimeRange(r + 1);
            return (
              <div key={`row-${r}`} className="contents">
                <div className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 flex flex-col items-center justify-center py-1 px-0.5" style={{ gridColumn: 1, gridRow: r + 1 }}>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">{r + 1}</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-none">{startTime}</span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-none">{endTime}</span>
                  </div>
                </div>
                {Array.from({ length: days }).map((_, c) => (
                  <div 
                    key={`cell-${r}-${c}`} 
                    className="border-b border-r border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-all duration-200 group relative"
                    style={{ gridColumn: c + 2, gridRow: r + 1 }}
                    onClick={() => mode === 'single' && onAddCourse?.(c + 1, r + 1)}
                  >
                    {mode === 'single' && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          +
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Courses (Absolute/Grid Placed) */}
          {mode === 'single' ? (
            filteredCourses.map(course => {
              if (course.dayOfWeek > days) return null;
              const span = course.endPeriod - course.startPeriod + 1;
              return (
                <div
                  key={course.id}
                  className={cn(
                    "m-1.5 p-3 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.03] flex flex-col gap-1 overflow-hidden z-10 shadow-sm hover:shadow-md relative border",
                    course.color || COLORS[0],
                    !course.isCurrentWeek && "opacity-60 grayscale"
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
                  {!course.isCurrentWeek && (
                    <div className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-gray-400 text-white">
                      非本周
                    </div>
                  )}
                  <div className="font-bold text-sm leading-tight break-words">
                    {course.name}
                  </div>
                  <div className="text-xs mt-auto flex flex-col gap-0.5 opacity-90">
                    <span className="break-words">{course.location}</span>
                    <span className="break-words">{course.teacher}</span>
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
                  const myCourse = filteredCourses.find(course => course.dayOfWeek === day && period >= course.startPeriod && period <= course.endPeriod);
                  const partnerCourse = filteredPartnerCourses.find(course => course.dayOfWeek === day && period >= course.startPeriod && period <= course.endPeriod);

                  if (!myCourse && !partnerCourse) {
                    return (
                      <div 
                        key={`couple-free-${day}-${period}`}
                        className="m-1.5 rounded-xl flex items-center justify-center pointer-events-none z-0 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                        style={{ 
                          gridColumn: day + 1, 
                          gridRow: period
                        }}
                      >
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">共同空闲</span>
                      </div>
                    );
                  }
                  return null;
                });
              })}

              {/* Together Courses */}
              {filteredCourses.map(myCourse => {
                if (myCourse.dayOfWeek > days) return null;
                const partnerCourse = filteredPartnerCourses.find(c => c.dayOfWeek === myCourse.dayOfWeek && c.startPeriod === myCourse.startPeriod && c.endPeriod === myCourse.endPeriod && c.name === myCourse.name);
                if (partnerCourse) {
                  const span = myCourse.endPeriod - myCourse.startPeriod + 1;
                  return (
                    <div
                      key={`together-${myCourse.id}`}
                      className={cn(
                        "m-1.5 p-3 rounded-xl flex flex-col justify-center items-center text-center z-10 shadow-sm relative border",
                        myCourse.isCurrentWeek 
                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" 
                          : "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700"
                      )}
                      style={{ 
                        gridColumn: myCourse.dayOfWeek + 1, 
                        gridRow: `${myCourse.startPeriod} / span ${span}`,
                        opacity: myCourse.isCurrentWeek ? 1 : 0.6
                      }}
                    >
                      {!myCourse.isCurrentWeek && (
                        <div className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-gray-400 dark:bg-gray-600 text-white">
                          非本周
                        </div>
                      )}
                      <span className={cn(
                        "text-xs font-bold mb-1",
                        myCourse.isCurrentWeek ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"
                      )}>一起上课 ✨</span>
                      <span className={cn(
                        "text-xs font-bold break-words",
                        myCourse.isCurrentWeek ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
                      )}>{myCourse.name}</span>
                      <span className={cn(
                        "text-[10px] mt-1 break-words",
                        myCourse.isCurrentWeek ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"
                      )}>{myCourse.location}</span>
                    </div>
                  );
                }
                return null;
              })}

              {/* My Courses (Not Together) */}
              {filteredCourses.map(myCourse => {
                if (myCourse.dayOfWeek > days) return null;
                const partnerCourse = filteredPartnerCourses.find(c => c.dayOfWeek === myCourse.dayOfWeek && c.startPeriod === myCourse.startPeriod && c.endPeriod === myCourse.endPeriod && c.name === myCourse.name);
                if (partnerCourse) return null;

                const span = myCourse.endPeriod - myCourse.startPeriod + 1;
                return (
                  <div
                    key={`my-${myCourse.id}`}
                    className={cn(
                      "m-1 p-2 rounded-xl shadow-sm flex flex-col gap-0.5 overflow-hidden z-10 relative border",
                      myCourse.isCurrentWeek 
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                        : "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700"
                    )}
                    style={{ 
                      gridColumn: myCourse.dayOfWeek + 1, 
                      gridRow: `${myCourse.startPeriod} / span ${span}`,
                      justifySelf: 'start',
                      width: 'calc(50% - 6px)',
                      opacity: myCourse.isCurrentWeek ? 1 : 0.6
                    }}
                  >
                    {!myCourse.isCurrentWeek && (
                      <div className="absolute top-0.5 right-0.5 text-[8px] px-1 py-0.5 rounded bg-gray-400 dark:bg-gray-600 text-white">
                        非本周
                      </div>
                    )}
                    <div className={cn(
                      "font-bold text-[10px] leading-tight break-words",
                      myCourse.isCurrentWeek ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                    )}>我: {myCourse.name}</div>
                    <div className={cn(
                      "text-[10px] break-words",
                      myCourse.isCurrentWeek ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"
                    )}>{myCourse.location}</div>
                  </div>
                );
              })}

              {/* Partner Courses (Not Together) */}
              {filteredPartnerCourses.map(partnerCourse => {
                if (partnerCourse.dayOfWeek > days) return null;
                const myCourse = filteredCourses.find(c => c.dayOfWeek === partnerCourse.dayOfWeek && c.startPeriod === partnerCourse.startPeriod && c.endPeriod === partnerCourse.endPeriod && c.name === partnerCourse.name);
                if (myCourse) return null;

                const span = partnerCourse.endPeriod - partnerCourse.startPeriod + 1;
                return (
                  <div
                    key={`partner-${partnerCourse.id}`}
                    className={cn(
                      "m-1 p-2 rounded-xl shadow-sm flex flex-col gap-0.5 overflow-hidden z-10 relative border",
                      partnerCourse.isCurrentWeek 
                        ? "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800" 
                        : "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700"
                    )}
                    style={{ 
                      gridColumn: partnerCourse.dayOfWeek + 1, 
                      gridRow: `${partnerCourse.startPeriod} / span ${span}`,
                      justifySelf: 'end',
                      width: 'calc(50% - 6px)',
                      opacity: partnerCourse.isCurrentWeek ? 1 : 0.6
                    }}
                  >
                    {!partnerCourse.isCurrentWeek && (
                      <div className="absolute top-0.5 right-0.5 text-[8px] px-1 py-0.5 rounded bg-gray-400 dark:bg-gray-600 text-white">
                        非本周
                      </div>
                    )}
                    <div className={cn(
                      "font-bold text-[10px] leading-tight break-words",
                      partnerCourse.isCurrentWeek ? "text-pink-600 dark:text-pink-400" : "text-gray-600 dark:text-gray-400"
                    )}>TA: {partnerCourse.name}</div>
                    <div className={cn(
                      "text-[10px] break-words",
                      partnerCourse.isCurrentWeek ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"
                    )}>{partnerCourse.location}</div>
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
