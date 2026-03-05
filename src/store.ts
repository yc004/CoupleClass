import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, Settings, ScheduleData } from './types';
import { nanoid } from 'nanoid';

interface User {
  id: number;
  email: string;
}

interface AppState {
  user: User | null;
  mySchedule: ScheduleData;
  partnerSchedule: ScheduleData | null;
  myShareCode: string | null;
  partnerCode: string | null;
  
  // User actions
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // Actions
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  clearAllCourses: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setPartnerSchedule: (schedule: ScheduleData | null) => void;
  setMyShareCode: (code: string) => void;
  setPartnerCode: (code: string | null) => void;
}

const defaultSettings: Settings = {
  showWeekends: false,
  totalPeriods: 12,
  classDuration: 45,
  breakDuration: 10,
  startTime: '08:00',
  periodTimes: [],
  semesterStartDate: new Date().toISOString().split('T')[0],
  totalWeeks: 20,
  showNonCurrentWeekCourses: false,
};

export const useStore = create<AppState>()((set) => ({
  user: null,
  mySchedule: {
    courses: [],
    settings: defaultSettings,
  },
  partnerSchedule: null,
  myShareCode: null,
  partnerCode: null,

  setUser: (user) => set({ user }),
  
  logout: () => set({ 
    user: null,
    mySchedule: { courses: [], settings: defaultSettings },
    partnerSchedule: null,
    myShareCode: null,
    partnerCode: null,
  }),

  addCourse: (course) =>
    set((state) => ({
      mySchedule: {
        ...state.mySchedule,
        courses: [...state.mySchedule.courses, { ...course, id: nanoid() }],
      },
    })),

  updateCourse: (id, updatedCourse) =>
    set((state) => ({
      mySchedule: {
        ...state.mySchedule,
        courses: state.mySchedule.courses.map((c) =>
          c.id === id ? { ...c, ...updatedCourse } : c
        ),
      },
    })),

  deleteCourse: (id) =>
    set((state) => ({
      mySchedule: {
        ...state.mySchedule,
        courses: state.mySchedule.courses.filter((c) => c.id !== id),
      },
    })),

  clearAllCourses: () =>
    set((state) => ({
      mySchedule: {
        ...state.mySchedule,
        courses: [],
      },
    })),

  updateSettings: (settings) =>
    set((state) => ({
      mySchedule: {
        ...state.mySchedule,
        settings: { ...state.mySchedule.settings, ...settings },
      },
    })),

  setPartnerSchedule: (schedule) => set({ partnerSchedule: schedule }),
  setMyShareCode: (code) => set({ myShareCode: code }),
  setPartnerCode: (code) => set({ partnerCode: code }),
}));
