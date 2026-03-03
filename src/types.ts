export type Course = {
  id: string;
  name: string;
  location: string;
  teacher: string;
  dayOfWeek: number; // 1 (Monday) to 7 (Sunday)
  startPeriod: number;
  endPeriod: number;
  color: string;
  weekType?: 'all' | 'odd' | 'even' | 'custom'; // 每周 | 单周 | 双周 | 自定义
  customWeeks?: number[]; // 自定义周数数组，如 [1, 3, 5, 7]
};

export type Settings = {
  showWeekends: boolean;
  totalPeriods: number;
  classDuration: number; // minutes
  breakDuration: number; // minutes
  startTime: string; // "08:00"
  periodTimes?: string[]; // Custom start times for each period
  semesterStartDate?: string; // "2024-09-01" 开学日期
  totalWeeks?: number; // 总教学周数
  showNonCurrentWeekCourses?: boolean; // 是否显示非本周课程
};

export type ScheduleData = {
  courses: Course[];
  settings: Settings;
};
