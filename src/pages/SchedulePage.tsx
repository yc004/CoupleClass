import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import ScheduleGrid from '../components/ScheduleGrid';
import CourseModal from '../components/CourseModal';
import ImportModal from '../components/ImportModal';
import { Course } from '../types';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

// 计算当前教学周
const getCurrentWeek = (semesterStartDate?: string): number | null => {
  if (!semesterStartDate) return null;
  const start = new Date(semesterStartDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return week > 0 ? week : null;
};

// 格式化日期
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekDay}`;
};

export default function SchedulePage() {
  const { mySchedule } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();
  const [initialData, setInitialData] = useState<Partial<Course>>({});

  const currentWeek = getCurrentWeek(mySchedule.settings.semesterStartDate);
  const [viewingWeek, setViewingWeek] = useState<number>(currentWeek || 1);
  const today = formatDate(new Date());

  // 触摸滑动相关
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 当currentWeek变化时，更新viewingWeek
  useEffect(() => {
    if (currentWeek !== null) {
      setViewingWeek(currentWeek);
    }
  }, [currentWeek]);

  const handleTouchStart = (e: TouchEvent | React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent | React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // 最小滑动距离

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // 向左滑动，下一周
        handleNextWeek();
      } else {
        // 向右滑动，上一周
        handlePrevWeek();
      }
    }
  };

  const handlePrevWeek = () => {
    setViewingWeek(prev => Math.max(1, prev - 1));
  };

  const handleNextWeek = () => {
    const maxWeek = mySchedule.settings.totalWeeks || 20;
    setViewingWeek(prev => Math.min(maxWeek, prev + 1));
  };

  const handleBackToCurrentWeek = () => {
    if (currentWeek !== null) {
      setViewingWeek(currentWeek);
    }
  };

  const handleAddCourse = (day: number, period: number) => {
    setInitialData({ dayOfWeek: day, startPeriod: period, endPeriod: period });
    setSelectedCourse(undefined);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setInitialData(course);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部信息栏容器 */}
      <div className="flat-card mx-4 mt-4 mb-3 p-3 rounded-xl shadow-sm shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* 日期和教学周信息 */}
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{today}</div>
            {currentWeek !== null && mySchedule.settings.totalWeeks && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                当前第 {currentWeek} 周 / 共 {mySchedule.settings.totalWeeks} 周
              </div>
            )}
          </div>

          {/* 周数切换控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              disabled={viewingWeek <= 1}
              className="flat-button p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="上一周"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <div className="flex flex-col items-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                第 {viewingWeek} 周
              </div>
              {viewingWeek !== currentWeek && currentWeek !== null && (
                <button
                  onClick={handleBackToCurrentWeek}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  回到本周
                </button>
              )}
            </div>

            <button
              onClick={handleNextWeek}
              disabled={viewingWeek >= (mySchedule.settings.totalWeeks || 20)}
              className="flat-button p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="下一周"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* 导入按钮 */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flat-button flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">一键导入课表</span>
            <span className="sm:hidden">导入</span>
          </button>
        </div>
      </div>

      {/* 课表网格 */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ScheduleGrid
          courses={mySchedule.courses}
          mode="single"
          onAddCourse={handleAddCourse}
          onEditCourse={handleEditCourse}
          currentWeek={viewingWeek}
        />
      </div>

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={initialData}
        courseId={selectedCourse?.id}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
