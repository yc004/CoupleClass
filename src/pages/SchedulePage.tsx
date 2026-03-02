import { useState } from 'react';
import { useStore } from '../store';
import ScheduleGrid from '../components/ScheduleGrid';
import CourseModal from '../components/CourseModal';
import { Course } from '../types';

export default function SchedulePage() {
  const { mySchedule } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();
  const [initialData, setInitialData] = useState<Partial<Course>>({});

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
    <div className="h-full p-2 md:p-8 flex flex-col gap-3 md:gap-6">
      <div className="flex items-center justify-between px-1 md:px-0 shrink-0">
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-stone-800 tracking-tight">我的课表</h1>
          <p className="hidden md:block text-stone-500 text-sm mt-1">管理你的每周课程</p>
        </div>
        <button
          onClick={() => handleAddCourse(1, 1)}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-stone-800 text-white text-sm md:text-base font-medium rounded-xl hover:bg-stone-700 transition-colors shadow-sm"
        >
          + 添加课程
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <ScheduleGrid
          courses={mySchedule.courses}
          mode="single"
          onAddCourse={handleAddCourse}
          onEditCourse={handleEditCourse}
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
