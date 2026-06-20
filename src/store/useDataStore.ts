import { create } from 'zustand';
import { Intersection, WaitRecord, Direction, TimerStatus, TimePeriod } from '@/types';
import { generateId, getTimePeriodFromDate } from '@/utils/timeUtils';
import { mockIntersections, mockRecords } from '@/data/mockData';

export type SaveResult = 'success' | 'too_short' | null;

interface DataState {
  intersections: Intersection[];
  records: WaitRecord[];
  timerStatus: TimerStatus;
  elapsedSeconds: number;
  selectedIntersectionId: string | null;
  selectedDirection: Direction | null;
  startTime: string | null;
  timerIntervalId: number | null;
  lastSaveResult: SaveResult;

  initData: () => void;
  setSelectedIntersection: (id: string | null) => void;
  setSelectedDirection: (direction: Direction | null) => void;

  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;

  addRecord: (record: Omit<WaitRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;

  addIntersection: (intersection: Omit<Intersection, 'id' | 'createdAt'>) => void;
  updateIntersection: (id: string, data: Partial<Intersection>) => void;
  deleteIntersection: (id: string) => void;
}

const STORAGE_KEY_INTERSECTIONS = 'traffic_light_intersections';
const STORAGE_KEY_RECORDS = 'traffic_light_records';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', key, error);
  }
}

export const useDataStore = create<DataState>((set, get) => ({
  intersections: [],
  records: [],
  timerStatus: 'idle',
  elapsedSeconds: 0,
  selectedIntersectionId: null,
  selectedDirection: null,
  startTime: null,
  timerIntervalId: null,
  lastSaveResult: null,

  initData: () => {
    const storedIntersections = loadFromStorage<Intersection[]>(STORAGE_KEY_INTERSECTIONS, []);
    const storedRecords = loadFromStorage<WaitRecord[]>(STORAGE_KEY_RECORDS, []);

    const intersections = storedIntersections.length > 0 ? storedIntersections : mockIntersections;
    const records = storedRecords.length > 0 ? storedRecords : mockRecords;

    if (storedIntersections.length === 0) {
      saveToStorage(STORAGE_KEY_INTERSECTIONS, mockIntersections);
    }
    if (storedRecords.length === 0) {
      saveToStorage(STORAGE_KEY_RECORDS, mockRecords);
    }

    set({
      intersections,
      records,
      selectedIntersectionId: intersections.length > 0 ? intersections[0].id : null,
      selectedDirection: 'east',
    });
  },

  setSelectedIntersection: (id) => set({ selectedIntersectionId: id }),
  setSelectedDirection: (direction) => set({ selectedDirection: direction }),

  startTimer: () => {
    const { selectedIntersectionId, selectedDirection, intersections } = get();
    if (!selectedIntersectionId || !selectedDirection) return;

    const startTime = new Date().toISOString();

    const intervalId = window.setInterval(() => {
      get().tick();
    }, 1000);

    set({
      timerStatus: 'running',
      startTime,
      elapsedSeconds: 0,
      timerIntervalId: intervalId,
      lastSaveResult: null,
    });
  },

  stopTimer: () => {
    const { timerIntervalId, elapsedSeconds, selectedIntersectionId, selectedDirection, startTime, intersections } = get();

    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }

    let saveResult: SaveResult = 'too_short';

    if (selectedIntersectionId && selectedDirection && startTime && elapsedSeconds > 0) {
      const intersection = intersections.find(i => i.id === selectedIntersectionId);
      const endTime = new Date().toISOString();
      const timePeriod = getTimePeriodFromDate(new Date(startTime));

      const newRecord: WaitRecord = {
        id: generateId(),
        intersectionId: selectedIntersectionId,
        intersectionName: intersection?.name || '',
        direction: selectedDirection,
        duration: elapsedSeconds,
        startTime,
        endTime,
        timePeriod,
      };

      const records = [newRecord, ...get().records];
      set({ records });
      saveToStorage(STORAGE_KEY_RECORDS, records);
      saveResult = 'success';
    }

    set({
      timerStatus: 'stopped',
      timerIntervalId: null,
      lastSaveResult: saveResult,
    });
  },

  resetTimer: () => {
    const { timerIntervalId } = get();
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }
    set({
      timerStatus: 'idle',
      elapsedSeconds: 0,
      startTime: null,
      timerIntervalId: null,
      lastSaveResult: null,
    });
  },

  tick: () => {
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
  },

  addRecord: (record) => {
    const newRecord = { ...record, id: generateId() };
    const records = [newRecord, ...get().records];
    set({ records });
    saveToStorage(STORAGE_KEY_RECORDS, records);
  },

  deleteRecord: (id) => {
    const records = get().records.filter(r => r.id !== id);
    set({ records });
    saveToStorage(STORAGE_KEY_RECORDS, records);
  },

  clearAllRecords: () => {
    set({ records: [] });
    saveToStorage(STORAGE_KEY_RECORDS, []);
  },

  addIntersection: (intersection) => {
    const newIntersection: Intersection = {
      ...intersection,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const intersections = [...get().intersections, newIntersection];
    set({ intersections });
    saveToStorage(STORAGE_KEY_INTERSECTIONS, intersections);
  },

  updateIntersection: (id, data) => {
    const intersections = get().intersections.map(i =>
      i.id === id ? { ...i, ...data } : i
    );
    set({ intersections });
    saveToStorage(STORAGE_KEY_INTERSECTIONS, intersections);
  },

  deleteIntersection: (id) => {
    const intersections = get().intersections.filter(i => i.id !== id);
    set({ intersections });
    saveToStorage(STORAGE_KEY_INTERSECTIONS, intersections);

    const state = get();
    if (state.selectedIntersectionId === id) {
      set({ selectedIntersectionId: intersections.length > 0 ? intersections[0].id : null });
    }
  },
}));
