export type Direction = 'east' | 'south' | 'west' | 'north';

export type TimePeriod = 'morning_peak' | 'evening_peak' | 'flat' | 'night';

export type TimerStatus = 'idle' | 'running' | 'stopped';

export interface Intersection {
  id: string;
  name: string;
  area: string;
  note?: string;
  reasonableWaitTime?: number;
  createdAt: string;
}

export type Tag = 'rushing' | 'pickup' | 'commute' | 'school' | 'shopping' | 'leisure';

export interface WaitRecord {
  id: string;
  intersectionId: string;
  intersectionName: string;
  direction: Direction;
  duration: number;
  startTime: string;
  endTime: string;
  timePeriod: TimePeriod;
  note?: string;
  tag?: Tag;
  isOverLimit?: boolean;
}

export interface IntersectionStats {
  intersectionId: string;
  intersectionName: string;
  recordCount: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  overLimitCount: number;
  overLimitRate: number;
}

export interface IntersectionGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  intersectionIds: string[];
  createdAt: string;
}

export interface GroupStats {
  groupId: string;
  groupName: string;
  color: string;
  intersectionCount: number;
  recordCount: number;
  avgDuration: number;
  maxDuration: number;
  totalDuration: number;
}

export const GROUP_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#84cc16', '#6366f1',
];

export const DIRECTION_LABELS: Record<Direction, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
};

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  morning_peak: '早高峰',
  evening_peak: '晚高峰',
  flat: '平峰',
  night: '夜间',
};

export const TAG_LABELS: Record<Tag, string> = {
  rushing: '赶时间',
  pickup: '接送孩子',
  commute: '通勤日常',
  school: '上下学',
  shopping: '购物出行',
  leisure: '休闲散步',
};

export const TAG_OPTIONS: { value: Tag; label: string }[] = [
  { value: 'rushing', label: '赶时间' },
  { value: 'pickup', label: '接送孩子' },
  { value: 'commute', label: '通勤日常' },
  { value: 'school', label: '上下学' },
  { value: 'shopping', label: '购物出行' },
  { value: 'leisure', label: '休闲散步' },
];
