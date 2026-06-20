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

export interface WaitRecord {
  id: string;
  intersectionId: string;
  intersectionName: string;
  direction: Direction;
  duration: number;
  startTime: string;
  endTime: string;
  timePeriod: TimePeriod;
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
