export type Course = {
  id: string;
  name: string;
  location: string;
  teacher: string;
  dayOfWeek: number; // 1 (Monday) to 7 (Sunday)
  startPeriod: number;
  endPeriod: number;
  color: string;
};

export type Settings = {
  showWeekends: boolean;
  totalPeriods: number;
  classDuration: number; // minutes
  breakDuration: number; // minutes
  startTime: string; // "08:00"
  periodTimes?: string[]; // Custom start times for each period
};

export type ScheduleData = {
  courses: Course[];
  settings: Settings;
};
