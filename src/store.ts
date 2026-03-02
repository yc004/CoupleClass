import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, Settings, ScheduleData } from './types';
import { nanoid } from 'nanoid';

interface AppState {
  mySchedule: ScheduleData;
  partnerSchedule: ScheduleData | null;
  myShareCode: string | null;
  
  // Actions
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setPartnerSchedule: (schedule: ScheduleData | null) => void;
  setMyShareCode: (code: string) => void;
}

const defaultSettings: Settings = {
  showWeekends: false,
  totalPeriods: 12,
  classDuration: 45,
  breakDuration: 10,
  startTime: '08:00',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      mySchedule: {
        courses: [],
        settings: defaultSettings,
      },
      partnerSchedule: null,
      myShareCode: null,

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

      updateSettings: (settings) =>
        set((state) => ({
          mySchedule: {
            ...state.mySchedule,
            settings: { ...state.mySchedule.settings, ...settings },
          },
        })),

      setPartnerSchedule: (schedule) => set({ partnerSchedule: schedule }),
      setMyShareCode: (code) => set({ myShareCode: code }),
    }),
    {
      name: 'syncedu-storage',
      partialize: (state) => ({
        mySchedule: state.mySchedule,
        myShareCode: state.myShareCode,
      }), // Don't persist partner schedule, load it fresh
    }
  )
);
