export type Direction = 'east' | 'south' | 'west' | 'north';

export type TimePeriod = 'morning_peak' | 'evening_peak' | 'flat' | 'night';

export type TimerStatus = 'idle' | 'running' | 'stopped';

export interface Intersection {
  id: string;
  name: string;
  area: string;
  note?: string;
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
}

export interface IntersectionStats {
  intersectionId: string;
  intersectionName: string;
  recordCount: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
}

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
