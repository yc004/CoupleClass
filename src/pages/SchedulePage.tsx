import { useState } from 'react';
import { useStore } from '../store';
import ScheduleGrid from '../components/ScheduleGrid';
import CourseModal from '../components/CourseModal';
import { Course } from '../types';

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
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();
  const [initialData, setInitialData] = useState<Partial<Course>>({});

  const currentWeek = getCurrentWeek(mySchedule.settings.semesterStartDate);
  const today = formatDate(new Date());

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
    <div className="h-full flex flex-col relative">
      {/* 左上角日期和教学周信息 */}
      <div className="absolute top-4 left-4 z-20 flat-card px-4 py-2 rounded-xl shadow-sm">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{today}</div>
        {currentWeek !== null && mySchedule.settings.totalWeeks && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            第 {currentWeek} 周 / 共 {mySchedule.settings.totalWeeks} 周
          </div>
        )}
      </div>

      {/* 课表网格 - 直接铺满 */}
      <div className="flex-1 min-h-0 pt-20">
        <ScheduleGrid
          courses={mySchedule.courses}
          mode="single"
          onAddCourse={handleAddCourse}
          onEditCourse={handleEditCourse}
          currentWeek={currentWeek}
        />
      </div>

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={initialData}
        courseId={selectedCourse?.id}
      />
    </div>
  );
}
