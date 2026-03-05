import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStore } from '../store';
import ScheduleGrid from '../components/ScheduleGrid';
import CourseModal from '../components/CourseModal';
import ImportModal from '../components/ImportModal';
import { Course } from '../types';
import { ChevronLeft, ChevronRight, Settings, Download, User, LogOut } from 'lucide-react';

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
  const { mySchedule, user } = useStore();
  const { setIsSettingsOpen, handleLogout } = useOutletContext<{ 
    setIsSettingsOpen: (open: boolean) => void;
    handleLogout: () => void;
  }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();
  const [initialData, setInitialData] = useState<Partial<Course>>({});
  const [showMenu, setShowMenu] = useState(false);

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
      <div className="mx-4 mt-2 mb-2 p-2 shrink-0">
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevWeek}
              disabled={viewingWeek <= 1}
              className="flat-button p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="上一周"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <div className="flex flex-col items-center min-w-[60px]">
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                第 {viewingWeek} 周
              </div>
              {viewingWeek !== currentWeek && currentWeek !== null && (
                <button
                  onClick={handleBackToCurrentWeek}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline leading-tight"
                >
                  回到本周
                </button>
              )}
            </div>

            <button
              onClick={handleNextWeek}
              disabled={viewingWeek >= (mySchedule.settings.totalWeeks || 20)}
              className="flat-button p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="下一周"
            >
              <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* 设置按钮和菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flat-button p-1.5 rounded-lg transition-all"
              title="设置"
            >
              <Settings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            {/* 下拉菜单 */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 flat-modal rounded-xl shadow-lg z-50 py-2">
                  {/* 用户信息 */}
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <User className="w-3 h-3" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsImportModalOpen(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <Download className="w-4 h-4" />
                    一键导入课表
                  </button>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    课表设置
                  </button>
                  
                  {/* 登出按钮 */}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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
