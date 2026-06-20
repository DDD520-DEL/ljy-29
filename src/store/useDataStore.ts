import { create } from 'zustand';
import { Intersection, WaitRecord, Direction, TimerStatus, Tag, IntersectionGroup, DailyReminder, CheckInRecord, CheckInReward } from '@/types';
import { generateId, getTimePeriodFromDate, formatDate } from '@/utils/timeUtils';
import { mockIntersections, mockRecords } from '@/data/mockData';

export type SaveResult = 'success' | 'too_short' | null;

export type SortOption = 'newest' | 'oldest' | 'duration_desc' | 'duration_asc';

interface Settings {
  autoResetTimer: boolean;
  defaultTimePeriod: string;
  defaultSort: SortOption;
}

interface DataState {
  intersections: Intersection[];
  records: WaitRecord[];
  groups: IntersectionGroup[];
  timerStatus: TimerStatus;
  elapsedSeconds: number;
  isOverLimit: boolean;
  selectedIntersectionId: string | null;
  selectedDirection: Direction | null;
  startTime: string | null;
  timerIntervalId: number | null;
  lastSaveResult: SaveResult;
  pendingRecord: Omit<WaitRecord, 'id' | 'note' | 'tag'> | null;
  reminders: DailyReminder[];
  checkInRecords: CheckInRecord[];
  settings: Settings;

  initData: () => void;
  setSelectedIntersection: (id: string | null) => void;
  setSelectedDirection: (direction: Direction | null) => void;

  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  triggerVibration: () => void;

  confirmSaveRecord: (note: string, tag: Tag | undefined) => void;
  addRecord: (record: Omit<WaitRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;
  bulkDeleteRecords: (ids: string[]) => void;
  bulkUpdateIntersection: (ids: string[], intersectionId: string, intersectionName: string) => void;

  addIntersection: (intersection: Omit<Intersection, 'id' | 'createdAt'>) => void;
  updateIntersection: (id: string, data: Partial<Intersection>) => void;
  deleteIntersection: (id: string) => void;

  addGroup: (group: Omit<IntersectionGroup, 'id' | 'createdAt'>) => void;
  updateGroup: (id: string, data: Partial<IntersectionGroup>) => void;
  deleteGroup: (id: string) => void;
  addIntersectionToGroup: (groupId: string, intersectionId: string) => void;
  removeIntersectionFromGroup: (groupId: string, intersectionId: string) => void;
  toggleIntersectionInGroup: (groupId: string, intersectionId: string) => void;

  addReminder: (reminder: Omit<DailyReminder, 'id'>) => void;
  updateReminder: (id: string, data: Partial<DailyReminder>) => void;
  deleteReminder: (id: string) => void;

  getStreakDays: () => number;
  getCheckInReward: () => CheckInReward;
  isTodayCheckedIn: () => boolean;
  ensureTodayCheckIn: () => void;
  recalculateCheckInForDate: (dateStr: string) => void;
  recalculateCheckInsForDates: (dateStrs: string[]) => void;

  updateSettings: (settings: Partial<Settings>) => void;
  clearAllData: () => void;
}

const STORAGE_KEY_INTERSECTIONS = 'traffic_light_intersections';
const STORAGE_KEY_RECORDS = 'traffic_light_records';
const STORAGE_KEY_GROUPS = 'traffic_light_groups';
const STORAGE_KEY_REMINDERS = 'traffic_light_reminders';
const STORAGE_KEY_CHECKINS = 'traffic_light_checkins';
const STORAGE_KEY_SETTINGS = 'traffic_light_settings';

const defaultSettings: Settings = {
  autoResetTimer: false,
  defaultTimePeriod: 'all',
  defaultSort: 'newest',
};

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

const defaultReminders: DailyReminder[] = [
  {
    id: 'reminder_morning',
    enabled: false,
    hour: 7,
    minute: 30,
    label: '早高峰出发提醒',
    vibrate: true,
  },
  {
    id: 'reminder_evening',
    enabled: false,
    hour: 17,
    minute: 30,
    label: '晚高峰出发提醒',
    vibrate: true,
  },
];

export const useDataStore = create<DataState>((set, get) => ({
  intersections: [],
  records: [],
  groups: [],
  timerStatus: 'idle',
  elapsedSeconds: 0,
  isOverLimit: false,
  selectedIntersectionId: null,
  selectedDirection: null,
  startTime: null,
  timerIntervalId: null,
  lastSaveResult: null,
  pendingRecord: null,
  reminders: [],
  checkInRecords: [],
  settings: defaultSettings,

  initData: () => {
    const storedIntersections = loadFromStorage<Intersection[]>(STORAGE_KEY_INTERSECTIONS, []);
    const storedRecords = loadFromStorage<WaitRecord[]>(STORAGE_KEY_RECORDS, []);
    const storedGroups = loadFromStorage<IntersectionGroup[]>(STORAGE_KEY_GROUPS, []);
    const storedReminders = loadFromStorage<DailyReminder[]>(STORAGE_KEY_REMINDERS, []);
    const storedCheckIns = loadFromStorage<CheckInRecord[]>(STORAGE_KEY_CHECKINS, []);
    const storedSettings = loadFromStorage<Settings>(STORAGE_KEY_SETTINGS, defaultSettings);

    const intersections = storedIntersections.length > 0 ? storedIntersections : mockIntersections;
    const records = storedRecords.length > 0 ? storedRecords : mockRecords;
    const groups = storedGroups.length > 0 ? storedGroups : mockGroups;
    const reminders = storedReminders.length > 0 ? storedReminders : defaultReminders;

    if (storedIntersections.length === 0) {
      saveToStorage(STORAGE_KEY_INTERSECTIONS, mockIntersections);
    }
    if (storedRecords.length === 0) {
      saveToStorage(STORAGE_KEY_RECORDS, mockRecords);
    }
    if (storedGroups.length === 0) {
      saveToStorage(STORAGE_KEY_GROUPS, mockGroups);
    }
    if (storedReminders.length === 0) {
      saveToStorage(STORAGE_KEY_REMINDERS, defaultReminders);
    }

    const settings = storedSettings || defaultSettings;
    if (!storedSettings) {
      saveToStorage(STORAGE_KEY_SETTINGS, defaultSettings);
    }

    set({
      intersections,
      records,
      groups,
      reminders,
      checkInRecords: storedCheckIns,
      settings,
      selectedIntersectionId: intersections.length > 0 ? intersections[0].id : null,
      selectedDirection: 'east',
    });

    setTimeout(() => {
      get().ensureTodayCheckIn();
    }, 100);
  },

  setSelectedIntersection: (id) => set({ selectedIntersectionId: id }),
  setSelectedDirection: (direction) => set({ selectedDirection: direction }),

  startTimer: () => {
    const { selectedIntersectionId, selectedDirection } = get();
    if (!selectedIntersectionId || !selectedDirection) return;

    const startTime = new Date().toISOString();

    const intervalId = window.setInterval(() => {
      get().tick();
    }, 1000);

    set({
      timerStatus: 'running',
      startTime,
      elapsedSeconds: 0,
      isOverLimit: false,
      timerIntervalId: intervalId,
      lastSaveResult: null,
    });
  },

  stopTimer: () => {
    const { timerIntervalId, elapsedSeconds, selectedIntersectionId, selectedDirection, startTime, intersections, isOverLimit } = get();

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
          isOverLimit,
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
      isOverLimit: false,
      startTime: null,
      timerIntervalId: null,
      lastSaveResult: null,
      pendingRecord: null,
    });
  },

  tick: () => {
    const { selectedIntersectionId, intersections, isOverLimit, triggerVibration } = get();
    const newElapsedSeconds = get().elapsedSeconds + 1;

    const intersection = intersections.find(i => i.id === selectedIntersectionId);
    const threshold = intersection?.reasonableWaitTime;
    const newIsOverLimit = threshold !== undefined && threshold > 0 && newElapsedSeconds >= threshold;

    if (newIsOverLimit && !isOverLimit) {
      triggerVibration();
    }

    set({
      elapsedSeconds: newElapsedSeconds,
      isOverLimit: newIsOverLimit,
    });
  },

  triggerVibration: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
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
    get().ensureTodayCheckIn();
  },

  addRecord: (record) => {
    const newRecord = { ...record, id: generateId() };
    const records = [newRecord, ...get().records];
    set({ records });
    saveToStorage(STORAGE_KEY_RECORDS, records);
    get().ensureTodayCheckIn();
  },

  deleteRecord: (id) => {
    const targetRecord = get().records.find(r => r.id === id);
    const records = get().records.filter(r => r.id !== id);
    set({ records });
    saveToStorage(STORAGE_KEY_RECORDS, records);
    if (targetRecord) {
      get().recalculateCheckInForDate(formatDate(targetRecord.startTime));
    }
  },

  clearAllRecords: () => {
    set({ records: [], checkInRecords: [] });
    saveToStorage(STORAGE_KEY_RECORDS, []);
    saveToStorage(STORAGE_KEY_CHECKINS, []);
  },

  bulkDeleteRecords: (ids) => {
    const targetRecords = get().records.filter(r => ids.includes(r.id));
    const affectedDates = targetRecords.map(r => formatDate(r.startTime));
    const records = get().records.filter(r => !ids.includes(r.id));
    set({ records });
    saveToStorage(STORAGE_KEY_RECORDS, records);
    if (affectedDates.length > 0) {
      get().recalculateCheckInsForDates(affectedDates);
    }
  },

  bulkUpdateIntersection: (ids, intersectionId, intersectionName) => {
    const records = get().records.map(r =>
      ids.includes(r.id)
        ? { ...r, intersectionId, intersectionName }
        : r
    );
    set({ records });
    saveToStorage(STORAGE_KEY_RECORDS, records);
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

  addReminder: (reminder) => {
    const newReminder: DailyReminder = {
      ...reminder,
      id: generateId(),
    };
    const reminders = [...get().reminders, newReminder];
    set({ reminders });
    saveToStorage(STORAGE_KEY_REMINDERS, reminders);
  },

  updateReminder: (id, data) => {
    const reminders = get().reminders.map(r =>
      r.id === id ? { ...r, ...data } : r
    );
    set({ reminders });
    saveToStorage(STORAGE_KEY_REMINDERS, reminders);
  },

  deleteReminder: (id) => {
    const reminders = get().reminders.filter(r => r.id !== id);
    set({ reminders });
    saveToStorage(STORAGE_KEY_REMINDERS, reminders);
  },

  recalculateCheckInForDate: (dateStr) => {
    const dateRecords = get().records.filter(r => formatDate(r.startTime) === dateStr);
    const recordCount = dateRecords.length;
    const totalDuration = dateRecords.reduce((sum, r) => sum + r.duration, 0);
    const checkedIn = recordCount > 0;

    const existingIndex = get().checkInRecords.findIndex(c => c.date === dateStr);
    const newRecord: CheckInRecord = {
      date: dateStr,
      checkedIn,
      recordCount,
      totalDuration,
    };

    let checkInRecords;
    if (existingIndex >= 0) {
      if (recordCount > 0) {
        checkInRecords = [...get().checkInRecords];
        checkInRecords[existingIndex] = newRecord;
      } else {
        checkInRecords = get().checkInRecords.filter(c => c.date !== dateStr);
      }
    } else if (recordCount > 0) {
      checkInRecords = [...get().checkInRecords, newRecord];
    } else {
      return;
    }

    set({ checkInRecords });
    saveToStorage(STORAGE_KEY_CHECKINS, checkInRecords);
  },

  recalculateCheckInsForDates: (dateStrs) => {
    const uniqueDates = Array.from(new Set(dateStrs));
    uniqueDates.forEach(dateStr => {
      get().recalculateCheckInForDate(dateStr);
    });
  },

  ensureTodayCheckIn: () => {
    const todayStr = formatDate(new Date().toISOString());
    get().recalculateCheckInForDate(todayStr);
  },

  isTodayCheckedIn: () => {
    const todayStr = formatDate(new Date().toISOString());
    const todayCheckIn = get().checkInRecords.find(c => c.date === todayStr);
    return todayCheckIn?.checkedIn ?? false;
  },

  getStreakDays: () => {
    const { checkInRecords } = get();
    if (checkInRecords.length === 0) return 0;

    const sortedDates = checkInRecords
      .filter(c => c.checkedIn)
      .map(c => c.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedDates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const todayStr = formatDate(new Date().toISOString());
    const hasToday = sortedDates.includes(todayStr);

    if (!hasToday) {
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    }

    while (true) {
      const dateStr = formatDate(currentDate.toISOString());
      if (sortedDates.includes(dateStr)) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    return streak;
  },

  getCheckInReward: (): CheckInReward => {
    const streak = get().getStreakDays();
    if (streak >= 30) return '30days';
    if (streak >= 14) return '14days';
    if (streak >= 7) return '7days';
    if (streak >= 3) return '3days';
    return 'none';
  },

  updateSettings: (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    set({ settings });
    saveToStorage(STORAGE_KEY_SETTINGS, settings);
  },

  clearAllData: () => {
    set({
      records: [],
      checkInRecords: [],
      intersections: [],
      groups: [],
      reminders: [],
      settings: defaultSettings,
      timerStatus: 'idle',
      elapsedSeconds: 0,
      isOverLimit: false,
      selectedIntersectionId: null,
      selectedDirection: null,
      startTime: null,
      timerIntervalId: null,
      lastSaveResult: null,
      pendingRecord: null,
    });
    saveToStorage(STORAGE_KEY_RECORDS, []);
    saveToStorage(STORAGE_KEY_CHECKINS, []);
    saveToStorage(STORAGE_KEY_INTERSECTIONS, []);
    saveToStorage(STORAGE_KEY_GROUPS, []);
    saveToStorage(STORAGE_KEY_REMINDERS, []);
    saveToStorage(STORAGE_KEY_SETTINGS, defaultSettings);
  },
}));
