import { WaitRecord, TimePeriod, TIME_PERIOD_LABELS } from '@/types';
import { formatDate } from './timeUtils';

export interface DayPrediction {
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  periods: PeriodPrediction[];
}

export interface PeriodPrediction {
  period: TimePeriod;
  periodLabel: string;
  predictedDuration: number;
  dataPoints: number;
}

export interface IntersectionPrediction {
  intersectionId: string;
  intersectionName: string;
  dailyPredictions: DayPrediction[];
}

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

function getNext7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
}

export function calculateMovingAveragePredictions(
  records: WaitRecord[],
  intersectionId: string,
  intersectionName: string,
  windowDays: number = 14
): IntersectionPrediction {
  const intersectionRecords = records.filter(r => r.intersectionId === intersectionId);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);
  cutoffDate.setHours(0, 0, 0, 0);

  const recentRecords = intersectionRecords.filter(r => new Date(r.startTime) >= cutoffDate);

  const periodDayMap = new Map<string, number[]>();

  recentRecords.forEach(record => {
    const dayOfWeek = getDayOfWeek(record.startTime);
    const key = `${dayOfWeek}-${record.timePeriod}`;
    if (!periodDayMap.has(key)) {
      periodDayMap.set(key, []);
    }
    periodDayMap.get(key)!.push(record.duration);
  });

  const overallPeriodMap = new Map<TimePeriod, number[]>();
  recentRecords.forEach(record => {
    if (!overallPeriodMap.has(record.timePeriod)) {
      overallPeriodMap.set(record.timePeriod, []);
    }
    overallPeriodMap.get(record.timePeriod)!.push(record.duration);
  });

  const overallAvg = recentRecords.length > 0
    ? recentRecords.reduce((sum, r) => sum + r.duration, 0) / recentRecords.length
    : 60;

  const next7Days = getNext7Days();
  const periods: TimePeriod[] = ['morning_peak', 'flat', 'evening_peak', 'night'];

  const dailyPredictions: DayPrediction[] = next7Days.map(date => {
    const dayOfWeek = date.getDay();
    const dateStr = formatDate(date.toISOString());

    const periodPredictions: PeriodPrediction[] = periods.map(period => {
      const key = `${dayOfWeek}-${period}`;
      const dayPeriodDurations = periodDayMap.get(key) || [];
      const overallPeriodDurations = overallPeriodMap.get(period) || [];

      let predictedDuration: number;
      let dataPoints: number;

      if (dayPeriodDurations.length >= 2) {
        predictedDuration = Math.round(
          dayPeriodDurations.reduce((a, b) => a + b, 0) / dayPeriodDurations.length
        );
        dataPoints = dayPeriodDurations.length;
      } else if (overallPeriodDurations.length > 0) {
        predictedDuration = Math.round(
          overallPeriodDurations.reduce((a, b) => a + b, 0) / overallPeriodDurations.length
        );
        dataPoints = overallPeriodDurations.length;
      } else {
        predictedDuration = Math.round(overallAvg);
        dataPoints = 0;
      }

      return {
        period,
        periodLabel: TIME_PERIOD_LABELS[period],
        predictedDuration,
        dataPoints,
      };
    });

    return {
      date: dateStr,
      dayOfWeek,
      dayLabel: dayOfWeek === 0 ? '今天' : DAY_LABELS[dayOfWeek],
      periods: periodPredictions,
    };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dailyPredictions[0].dayLabel = '今天';

  return {
    intersectionId,
    intersectionName,
    dailyPredictions,
  };
}

export function calculateAllPredictions(
  records: WaitRecord[],
  intersections: { id: string; name: string }[],
  windowDays: number = 14
): IntersectionPrediction[] {
  return intersections.map(intersection =>
    calculateMovingAveragePredictions(records, intersection.id, intersection.name, windowDays)
  );
}

export function getCurrentPeriodPrediction(
  prediction: IntersectionPrediction,
  date: Date = new Date()
): PeriodPrediction | null {
  const hour = date.getHours();
  let currentPeriod: TimePeriod;
  if (hour >= 7 && hour < 9) {
    currentPeriod = 'morning_peak';
  } else if (hour >= 17 && hour < 19) {
    currentPeriod = 'evening_peak';
  } else if (hour >= 6 && hour < 22) {
    currentPeriod = 'flat';
  } else {
    currentPeriod = 'night';
  }

  const todayStr = formatDate(date.toISOString());
  const todayPrediction = prediction.dailyPredictions.find(d => d.date === todayStr);

  if (!todayPrediction) return null;

  return todayPrediction.periods.find(p => p.period === currentPeriod) || null;
}
