import { WaitRecord, Intersection, TimingScore, TimePeriod } from '@/types';

const MIN_RECORDS_FOR_SCORE = 5;

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateAvgDurationScore(avgDuration: number, reasonableTime: number): number {
  if (reasonableTime <= 0) return 60;

  const ratio = avgDuration / reasonableTime;

  if (ratio <= 0.5) {
    return 80 + (0.5 - ratio) * 40;
  } else if (ratio <= 0.8) {
    return 90 + (0.8 - ratio) * 33.33;
  } else if (ratio <= 1.0) {
    return 75 + (1.0 - ratio) * 75;
  } else if (ratio <= 1.2) {
    return 60 + (1.2 - ratio) * 75;
  } else if (ratio <= 1.5) {
    return 40 + (1.5 - ratio) * 66.67;
  } else if (ratio <= 2.0) {
    return 20 + (2.0 - ratio) * 40;
  } else {
    return Math.max(0, 20 - (ratio - 2.0) * 20);
  }
}

function calculatePeakValleyScore(peakAvg: number, flatAvg: number): number {
  if (flatAvg === 0) return 60;

  const ratio = peakAvg / flatAvg;

  if (ratio <= 1.2) {
    return 90 + (1.2 - ratio) * 50;
  } else if (ratio <= 1.5) {
    return 70 + (1.5 - ratio) * 66.67;
  } else if (ratio <= 2.0) {
    return 50 + (2.0 - ratio) * 40;
  } else if (ratio <= 2.5) {
    return 30 + (2.5 - ratio) * 40;
  } else if (ratio <= 3.0) {
    return 15 + (3.0 - ratio) * 30;
  } else {
    return Math.max(0, 15 - (ratio - 3.0) * 10);
  }
}

function calculateVarianceScore(variance: number, avgDuration: number): number {
  if (avgDuration === 0) return 60;

  const coefficientOfVariation = Math.sqrt(variance) / avgDuration;

  if (coefficientOfVariation <= 0.1) {
    return 90 + (0.1 - coefficientOfVariation) * 100;
  } else if (coefficientOfVariation <= 0.2) {
    return 75 + (0.2 - coefficientOfVariation) * 150;
  } else if (coefficientOfVariation <= 0.35) {
    return 55 + (0.35 - coefficientOfVariation) * 133.33;
  } else if (coefficientOfVariation <= 0.5) {
    return 35 + (0.5 - coefficientOfVariation) * 133.33;
  } else if (coefficientOfVariation <= 0.7) {
    return 15 + (0.7 - coefficientOfVariation) * 100;
  } else {
    return Math.max(0, 15 - (coefficientOfVariation - 0.7) * 50);
  }
}

function calculateOverLimitScore(overLimitRate: number): number {
  if (overLimitRate <= 0.05) {
    return 90 + (0.05 - overLimitRate) * 200;
  } else if (overLimitRate <= 0.15) {
    return 70 + (0.15 - overLimitRate) * 200;
  } else if (overLimitRate <= 0.3) {
    return 50 + (0.3 - overLimitRate) * 133.33;
  } else if (overLimitRate <= 0.5) {
    return 30 + (0.5 - overLimitRate) * 100;
  } else if (overLimitRate <= 0.7) {
    return 15 + (0.7 - overLimitRate) * 75;
  } else {
    return Math.max(0, 15 - (overLimitRate - 0.7) * 50);
  }
}

function getGrade(score: number): TimingScore['grade'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  if (score >= 40) return 'poor';
  return 'very_poor';
}

function generateSuggestions(
  avgDurationScore: number,
  peakValleyScore: number,
  varianceScore: number,
  overLimitScore: number,
  details: TimingScore['details']
): string[] {
  const suggestions: string[] = [];

  if (avgDurationScore < 60) {
    if (details.avgDuration > details.reasonableTime * 1.5) {
      suggestions.push('平均等待时间过长，建议适当增加该方向绿灯时长或优化信号灯配时方案');
    } else if (details.avgDuration > details.reasonableTime) {
      suggestions.push('平均等待时间略长，可考虑微调绿灯配时');
    }
  } else if (avgDurationScore >= 90 && details.avgDuration < details.reasonableTime * 0.5) {
    suggestions.push('该路口等待时间很短，当前配时效率优秀');
  }

  if (peakValleyScore < 60) {
    suggestions.push('早晚高峰与平峰时段等待差异较大，建议启用分时段配时方案，高峰时段增加绿灯时长');
  }

  if (varianceScore < 60) {
    suggestions.push('等待时长波动较大，说明配时稳定性不足，建议根据流量变化动态调整配时');
  }

  if (overLimitScore < 60) {
    if (details.overLimitRate > 0.5) {
      suggestions.push('超过半数的等待都超限，配时方案急需优化，建议重新评估各方向流量比例');
    } else if (details.overLimitRate > 0.3) {
      suggestions.push('超限等待比例较高，建议适当延长绿灯时间或设置黄灯警示');
    }
  }

  if (suggestions.length === 0) {
    if (avgDurationScore >= 80 && peakValleyScore >= 80 && varianceScore >= 80 && overLimitScore >= 80) {
      suggestions.push('该路口配时方案表现优秀，各项指标均衡，建议继续保持');
    } else {
      suggestions.push('该路口配时总体合理，可根据实际流量变化持续优化');
    }
  }

  return suggestions;
}

export function calculateIntersectionTimingScore(
  intersection: Intersection,
  records: WaitRecord[]
): TimingScore | null {
  const intersectionRecords = records.filter(r => r.intersectionId === intersection.id);

  if (intersectionRecords.length < MIN_RECORDS_FOR_SCORE) {
    return null;
  }

  const durations = intersectionRecords.map(r => r.duration);
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const variance = calculateVariance(durations);
  const reasonableTime = intersection.reasonableWaitTime || 90;

  const peakPeriods: TimePeriod[] = ['morning_peak', 'evening_peak'];
  const flatPeriods: TimePeriod[] = ['flat'];

  const peakRecords = intersectionRecords.filter(r => peakPeriods.includes(r.timePeriod));
  const flatRecords = intersectionRecords.filter(r => flatPeriods.includes(r.timePeriod));

  const peakAvg = peakRecords.length > 0
    ? peakRecords.reduce((sum, r) => sum + r.duration, 0) / peakRecords.length
    : avgDuration;
  const flatAvg = flatRecords.length > 0
    ? flatRecords.reduce((sum, r) => sum + r.duration, 0) / flatRecords.length
    : avgDuration;

  const overLimitCount = intersectionRecords.filter(r => r.isOverLimit).length;
  const overLimitRate = overLimitCount / intersectionRecords.length;

  const avgDurationScore = calculateAvgDurationScore(avgDuration, reasonableTime);
  const peakValleyScore = calculatePeakValleyScore(peakAvg, flatAvg);
  const varianceScore = calculateVarianceScore(variance, avgDuration);
  const overLimitScore = calculateOverLimitScore(overLimitRate);

  const totalScore = Math.round(
    avgDurationScore * 0.4 +
    peakValleyScore * 0.3 +
    varianceScore * 0.2 +
    overLimitScore * 0.1
  );

  const grade = getGrade(totalScore);

  const details = {
    avgDuration: Math.round(avgDuration),
    reasonableTime,
    peakAvg: Math.round(peakAvg),
    flatAvg: Math.round(flatAvg),
    variance: Math.round(variance),
    overLimitRate: Math.round(overLimitRate * 100),
    recordCount: intersectionRecords.length,
  };

  const suggestions = generateSuggestions(
    avgDurationScore,
    peakValleyScore,
    varianceScore,
    overLimitScore,
    details
  );

  return {
    intersectionId: intersection.id,
    intersectionName: intersection.name,
    totalScore,
    grade,
    dimensions: {
      avgDurationScore: Math.round(avgDurationScore),
      peakValleyScore: Math.round(peakValleyScore),
      varianceScore: Math.round(varianceScore),
      overLimitScore: Math.round(overLimitScore),
    },
    details,
    suggestions,
  };
}

export function calculateAllTimingScores(
  intersections: Intersection[],
  records: WaitRecord[]
): Map<string, TimingScore> {
  const scoreMap = new Map<string, TimingScore>();

  intersections.forEach((intersection) => {
    const score = calculateIntersectionTimingScore(intersection, records);
    if (score) {
      scoreMap.set(intersection.id, score);
    }
  });

  return scoreMap;
}
