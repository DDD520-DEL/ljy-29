import { create } from 'zustand';
import { Intersection, WaitRecord, Direction, TimerStatus, TimePeriod, Tag, IntersectionGroup } from '@/types';
import { generateId, getTimePeriodFromDate } from '@/utils/timeUtils';
import { mockIntersections, mockRecords } from '@/data/mockData';

export type SaveResult = 'success' | 'too_short' | null;

interface DataState {
  intersections: Intersection[];
  records: WaitRecord[];
  groups: IntersectionGroup[];
  timerStatus: TimerStatus;
  elapsedSeconds: number;
  selectedIntersectionId: string | null;
  selectedDirection: Direction | null;
  startTime: string | null;
  timerIntervalId: number | null;
  lastSaveResult: SaveResult;
  pendingRecord: Omit<WaitRecord, 'id' | 'note' | 'tag'> | null;

  initData: () => void;
  setSelectedIntersection: (id: string | null) => void;
  setSelectedDirection: (direction: Direction | null) => void;

  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;

  confirmSaveRecord: (note: string, tag: Tag | undefined) => void;
  addRecord: (record: Omit<WaitRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;

  addIntersection: (intersection: Omit<Intersection, 'id' | 'createdAt'>) => void;
  updateIntersection: (id: string, data: Partial<Intersection>) => void;
  deleteIntersection: (id: string) => void;

  addGroup: (group: Omit<IntersectionGroup, 'id' | 'createdAt'>) => void;
  updateGroup: (id: string, data: Partial<IntersectionGroup>) => void;
  deleteGroup: (id: string) => void;
  addIntersectionToGroup: (groupId: string, intersectionId: string) => void;
  removeIntersectionFromGroup: (groupId: string, intersectionId: string) => void;
  toggleIntersectionInGroup: (groupId: string, intersectionId: string) => void;
}

const STORAGE_KEY_INTERSECTIONS = 'traffic_light_intersections';
const STORAGE_KEY_RECORDS = 'traffic_light_records';
const STORAGE_KEY_GROUPS = 'traffic_light_groups';

const mockGroups: IntersectionGroup[] = [
  {
    id: 'group_001',
    name: '上班路线',
    description: '工作日通勤常用路口',
    color: '#3b82f6',
    intersectionIds: ['int_001', 'int_002', 'int_004'],
    createdAt: '2025-01-20T10:00:00.000Z',
  },
  {
    id: 'group_002',
    name: '周末常走',
    description: '周末休闲出行路线',
    color: '#10b981',
    intersectionIds: ['int_003', 'int_005'],
    createdAt: '2025-01-21T14:30:00.000Z',
  },
];

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
  groups: [],
  timerStatus: 'idle',
  elapsedSeconds: 0,
  selectedIntersectionId: null,
  selectedDirection: null,
  startTime: null,
  timerIntervalId: null,
  lastSaveResult: null,
  pendingRecord: null,

  initData: () => {
    const storedIntersections = loadFromStorage<Intersection[]>(STORAGE_KEY_INTERSECTIONS, []);
    const storedRecords = loadFromStorage<WaitRecord[]>(STORAGE_KEY_RECORDS, []);
    const storedGroups = loadFromStorage<IntersectionGroup[]>(STORAGE_KEY_GROUPS, []);

    const intersections = storedIntersections.length > 0 ? storedIntersections : mockIntersections;
    const records = storedRecords.length > 0 ? storedRecords : mockRecords;
    const groups = storedGroups.length > 0 ? storedGroups : mockGroups;

    if (storedIntersections.length === 0) {
      saveToStorage(STORAGE_KEY_INTERSECTIONS, mockIntersections);
    }
    if (storedRecords.length === 0) {
      saveToStorage(STORAGE_KEY_RECORDS, mockRecords);
    }
    if (storedGroups.length === 0) {
      saveToStorage(STORAGE_KEY_GROUPS, mockGroups);
    }

    set({
      intersections,
      records,
      groups,
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

    if (selectedIntersectionId && selectedDirection && startTime && elapsedSeconds > 0) {
      const intersection = intersections.find(i => i.id === selectedIntersectionId);
      const endTime = new Date().toISOString();
      const timePeriod = getTimePeriodFromDate(new Date(startTime));

      set({
        timerStatus: 'stopped',
        timerIntervalId: null,
        lastSaveResult: null,
        pendingRecord: {
          intersectionId: selectedIntersectionId,
          intersectionName: intersection?.name || '',
          direction: selectedDirection,
          duration: elapsedSeconds,
          startTime,
          endTime,
          timePeriod,
        },
      });
    } else {
      set({
        timerStatus: 'stopped',
        timerIntervalId: null,
        lastSaveResult: 'too_short',
        pendingRecord: null,
      });
    }
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
      pendingRecord: null,
    });
  },

  tick: () => {
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
  },

  confirmSaveRecord: (note, tag) => {
    const { pendingRecord } = get();
    if (!pendingRecord) return;

    const newRecord: WaitRecord = {
      id: generateId(),
      ...pendingRecord,
      note: note || undefined,
      tag,
    };

    const records = [newRecord, ...get().records];
    set({
      records,
      lastSaveResult: 'success',
      pendingRecord: null,
    });
    saveToStorage(STORAGE_KEY_RECORDS, records);
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

    const groups = get().groups.map(g => ({
      ...g,
      intersectionIds: g.intersectionIds.filter(intId => intId !== id),
    }));
    set({ groups });
    saveToStorage(STORAGE_KEY_GROUPS, groups);
  },

  addGroup: (group) => {
    const newGroup: IntersectionGroup = {
      ...group,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const groups = [...get().groups, newGroup];
    set({ groups });
    saveToStorage(STORAGE_KEY_GROUPS, groups);
  },

  updateGroup: (id, data) => {
    const groups = get().groups.map(g =>
      g.id === id ? { ...g, ...data } : g
    );
    set({ groups });
    saveToStorage(STORAGE_KEY_GROUPS, groups);
  },

  deleteGroup: (id) => {
    const groups = get().groups.filter(g => g.id !== id);
    set({ groups });
    saveToStorage(STORAGE_KEY_GROUPS, groups);
  },

  addIntersectionToGroup: (groupId, intersectionId) => {
    const groups = get().groups.map(g => {
      if (g.id !== groupId) return g;
      if (g.intersectionIds.includes(intersectionId)) return g;
      return { ...g, intersectionIds: [...g.intersectionIds, intersectionId] };
    });
    set({ groups });
    saveToStorage(STORAGE_KEY_GROUPS, groups);
  },

  removeIntersectionFromGroup: (groupId, intersectionId) => {
    const groups = get().groups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, intersectionIds: g.intersectionIds.filter(id => id !== intersectionId) };
    });
    set({ groups });
    saveToStorage(STORAGE_KEY_GROUPS, groups);
  },

  toggleIntersectionInGroup: (groupId, intersectionId) => {
    const groups = get().groups.map(g => {
      if (g.id !== groupId) return g;
      const hasIntersection = g.intersectionIds.includes(intersectionId);
      return {
        ...g,
        intersectionIds: hasIntersection
          ? g.intersectionIds.filter(id => id !== intersectionId)
          : [...g.intersectionIds, intersectionId],
      };
    });
    set({ groups });
    saveToStorage(STORAGE_KEY_GROUPS, groups);
  },
}));
