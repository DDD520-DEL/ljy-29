import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  GitCompare,
  Clock,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  BarChart3,
  Timer,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '@/store/useDataStore';
import { TIME_PERIOD_LABELS, TimePeriod, Intersection } from '@/types';
import { formatDate, getDaysAgoDate } from '@/utils/timeUtils';

const COMPARE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

interface IntersectionCompareStats {
  intersectionId: string;
  intersectionName: string;
  color: string;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  recordCount: number;
  overLimitCount: number;
  overLimitRate: number;
}

export default function ComparisonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { records, intersections } = useDataStore();

  const initialSelected = useMemo(() => {
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      return idsParam.split(',').filter(id => intersections.some(i => i.id === id));
    }
    return [];
  }, [searchParams, intersections]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
  const [timeRange, setTimeRange] = useState<'7' | '30'>('30');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    if (initialSelected.length > 0) {
      setSelectedIds(initialSelected);
    }
  }, [initialSelected]);

  const toggleIntersection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const removeIntersection = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const selectedIntersections = useMemo(
    () => intersections.filter(i => selectedIds.includes(i.id)),
    [intersections, selectedIds]
  );

  const filteredRecords = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoffDate = getDaysAgoDate(days);
    return records.filter(r =>
      new Date(r.startTime) >= cutoffDate && selectedIds.includes(r.intersectionId)
    );
  }, [records, selectedIds, timeRange]);

  const intersectionStatsMap = useMemo(() => {
    const statsMap = new Map<string, IntersectionCompareStats>();

    selectedIntersections.forEach((intersection, index) => {
      statsMap.set(intersection.id, {
        intersectionId: intersection.id,
        intersectionName: intersection.name,
        color: COMPARE_COLORS[index % COMPARE_COLORS.length],
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        recordCount: 0,
        overLimitCount: 0,
        overLimitRate: 0,
      });
    });

    filteredRecords.forEach(record => {
      const existing = statsMap.get(record.intersectionId);
      if (existing) {
        if (existing.recordCount === 0) {
          existing.minDuration = record.duration;
          existing.maxDuration = record.duration;
        } else {
          existing.minDuration = Math.min(existing.minDuration, record.duration);
          existing.maxDuration = Math.max(existing.maxDuration, record.duration);
        }
        existing.avgDuration += record.duration;
        existing.recordCount += 1;
        if (record.isOverLimit) {
          existing.overLimitCount += 1;
        }
      }
    });

    statsMap.forEach(stat => {
      if (stat.recordCount > 0) {
        stat.avgDuration = Math.round(stat.avgDuration / stat.recordCount);
        stat.overLimitRate = Math.round((stat.overLimitCount / stat.recordCount) * 100);
      }
    });

    return statsMap;
  }, [selectedIntersections, filteredRecords]);

  const dailyTrendData = useMemo(() => {
    const days = parseInt(timeRange);
    const dateMap = new Map<string, Map<string, number[]>>();

    for (let i = days - 1; i >= 0; i--) {
      const date = getDaysAgoDate(i);
      const key = formatDate(date.toISOString());
      dateMap.set(key, new Map());
      selectedIntersections.forEach(intersection => {
        dateMap.get(key)!.set(intersection.id, []);
      });
    }

    filteredRecords.forEach(record => {
      const key = formatDate(record.startTime);
      if (dateMap.has(key) && dateMap.get(key)!.has(record.intersectionId)) {
        dateMap.get(key)!.get(record.intersectionId)!.push(record.duration);
      }
    });

    return Array.from(dateMap.entries()).map(([date, intMap]) => {
      const item: Record<string, string | number | null> = { date: date.slice(5) };
      intMap.forEach((durations, intId) => {
        const intersection = intersections.find(i => i.id === intId);
        if (intersection) {
          item[intersection.name] = durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : null;
        }
      });
      return item;
    });
  }, [selectedIntersections, filteredRecords, timeRange, intersections]);

  const periodDistributionData = useMemo(() => {
    const periodOrder: TimePeriod[] = ['morning_peak', 'flat', 'evening_peak', 'night'];
    const periodMap = new Map<TimePeriod, Map<string, { total: number; count: number }>>();

    periodOrder.forEach(period => {
      periodMap.set(period, new Map());
      selectedIntersections.forEach(intersection => {
        periodMap.get(period)!.set(intersection.id, { total: 0, count: 0 });
      });
    });

    filteredRecords.forEach(record => {
      const periodData = periodMap.get(record.timePeriod);
      if (periodData && periodData.has(record.intersectionId)) {
        const existing = periodData.get(record.intersectionId)!;
        existing.total += record.duration;
        existing.count += 1;
      }
    });

    return periodOrder.map(period => {
      const item: Record<string, string | number> = { period: TIME_PERIOD_LABELS[period] };
      const periodData = periodMap.get(period)!;
      periodData.forEach((data, intId) => {
        const intersection = intersections.find(i => i.id === intId);
        if (intersection) {
          item[intersection.name] = data.count > 0 ? Math.round(data.total / data.count) : 0;
        }
      });
      return item;
    });
  }, [selectedIntersections, filteredRecords, intersections]);

  const comparisonSummary = useMemo(() => {
    const stats = Array.from(intersectionStatsMap.values()).filter(s => s.recordCount > 0);
    if (stats.length < 2) return null;

    const sortedByAvg = [...stats].sort((a, b) => a.avgDuration - b.avgDuration);
    const fastest = sortedByAvg[0];
    const slowest = sortedByAvg[sortedByAvg.length - 1];
    const avgDiff = slowest.avgDuration - fastest.avgDuration;

    const sortedByOverLimit = [...stats].sort((a, b) => a.overLimitRate - b.overLimitRate);
    const mostStable = sortedByOverLimit[0];
    const leastStable = sortedByOverLimit[sortedByOverLimit.length - 1];

    const bestPeriodByIntersection = selectedIntersections.map(intersection => {
      const intRecords = filteredRecords.filter(r => r.intersectionId === intersection.id);
      if (intRecords.length === 0) return null;
      const periodMap = new Map<TimePeriod, number[]>();
      intRecords.forEach(r => {
        if (!periodMap.has(r.timePeriod)) periodMap.set(r.timePeriod, []);
        periodMap.get(r.timePeriod)!.push(r.duration);
      });
      let bestPeriod: TimePeriod | null = null;
      let bestAvg = Infinity;
      periodMap.forEach((durations, period) => {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        if (avg < bestAvg) {
          bestAvg = avg;
          bestPeriod = period;
        }
      });
      return {
        intersection,
        bestPeriod,
        bestAvg: Math.round(bestAvg),
      };
    }).filter(Boolean) as { intersection: Intersection; bestPeriod: TimePeriod; bestAvg: number }[];

    return {
      fastest,
      slowest,
      avgDiff,
      mostStable,
      leastStable,
      bestPeriodByIntersection,
    };
  }, [intersectionStatsMap, selectedIntersections, filteredRecords]);

  interface TooltipPayloadItem {
    name: string;
    value: number | null;
    color: string;
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value !== null ? `${entry.value}秒` : '暂无数据'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">路口对比分析</h1>
            <p className="text-slate-400 text-sm">选择2-4个路口进行多维度对比</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">已选路口 ({selectedIds.length}/4)</span>
            <button
              type="button"
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              {isSelectorOpen ? '收起选择器' : '修改选择'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {selectedIntersections.map((intersection, index) => (
              <div
                key={intersection.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: COMPARE_COLORS[index % COMPARE_COLORS.length] + '25',
                  border: `1px solid ${COMPARE_COLORS[index % COMPARE_COLORS.length]}50`,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COMPARE_COLORS[index % COMPARE_COLORS.length] }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: COMPARE_COLORS[index % COMPARE_COLORS.length] }}
                >
                  {intersection.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeIntersection(intersection.id)}
                  className="ml-1 hover:opacity-70"
                  style={{ color: COMPARE_COLORS[index % COMPARE_COLORS.length] }}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedIds.length === 0 && (
              <span className="text-sm text-slate-500">请在下方选择路口进行对比</span>
            )}
          </div>

          {isSelectorOpen && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-4">
              <div className="text-sm text-slate-400 mb-3">
                点击选择或取消路口（最多4个）
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {intersections.map(intersection => {
                  const isSelected = selectedIds.includes(intersection.id);
                  const isDisabled = !isSelected && selectedIds.length >= 4;
                  const index = selectedIds.indexOf(intersection.id);
                  return (
                    <button
                      key={intersection.id}
                      type="button"
                      onClick={() => toggleIntersection(intersection.id)}
                      disabled={isDisabled}
                      className={`p-3 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border border-amber-500/50'
                          : isDisabled
                          ? 'bg-slate-800/50 border border-slate-700/30 opacity-50 cursor-not-allowed'
                          : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${
                          isSelected ? 'text-amber-400' : 'text-white'
                        }`}>
                          {intersection.name}
                        </span>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: COMPARE_COLORS[index % COMPARE_COLORS.length] }}
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {intersection.area}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {(['7', '30'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              近{range}天
            </button>
          ))}
        </div>

        {selectedIds.length < 2 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
            <GitCompare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">请至少选择2个路口开始对比</p>
            <p className="text-xs text-slate-600 mt-1">最多可同时对比4个路口</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {selectedIntersections.map((intersection, index) => {
                const stat = intersectionStatsMap.get(intersection.id);
                const color = COMPARE_COLORS[index % COMPARE_COLORS.length];
                return (
                  <div
                    key={intersection.id}
                    className="bg-slate-800/50 rounded-xl p-4 border"
                    style={{ borderColor: color + '50' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-white truncate">{intersection.name}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 平均等待
                        </span>
                        <span className="text-lg font-bold" style={{ color }}>
                          {stat?.recordCount ? `${stat.avgDuration}s` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Timer className="w-3 h-3" /> 记录次数
                        </span>
                        <span className="text-sm text-slate-300">{stat?.recordCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 超限率
                        </span>
                        <span className={`text-sm font-medium ${
                          (stat?.overLimitRate || 0) > 30 ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {stat?.recordCount ? `${stat.overLimitRate}%` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                平均等待时长趋势对比
              </h2>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                {dailyTrendData.some(d => Object.values(d).some(v => v !== null && typeof v === 'number')) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        {selectedIntersections.map((intersection, index) => (
                          <Line
                            key={intersection.id}
                            type="monotone"
                            dataKey={intersection.name}
                            stroke={COMPARE_COLORS[index % COMPARE_COLORS.length]}
                            strokeWidth={2}
                            dot={{
                              fill: COMPARE_COLORS[index % COMPARE_COLORS.length],
                              strokeWidth: 2,
                              r: 3,
                            }}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                时段分布对比
              </h2>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                {periodDistributionData.some(d => Object.values(d).some(v => typeof v === 'number' && v > 0)) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={periodDistributionData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        {selectedIntersections.map((intersection, index) => (
                          <Bar
                            key={intersection.id}
                            dataKey={intersection.name}
                            fill={COMPARE_COLORS[index % COMPARE_COLORS.length]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            {comparisonSummary && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  对比结论摘要
                </h2>
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-0.5">等待时长最短</div>
                      <div className="text-white font-medium">
                        <span className="text-green-400 font-bold">{comparisonSummary.fastest.intersectionName}</span>
                        {' '}平均等待 {comparisonSummary.fastest.avgDuration} 秒
                        {comparisonSummary.avgDiff > 0 && (
                          <span className="text-slate-400">
                            ，比{' '}
                            <span style={{ color: comparisonSummary.slowest.color }}>
                              {comparisonSummary.slowest.intersectionName}
                            </span>
                            {' '}少 <span className="text-green-400 font-bold">{comparisonSummary.avgDiff}</span> 秒
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-0.5">等待时长最长</div>
                      <div className="text-white font-medium">
                        <span style={{ color: comparisonSummary.slowest.color }} className="font-bold">
                          {comparisonSummary.slowest.intersectionName}
                        </span>
                        {' '}平均等待 {comparisonSummary.slowest.avgDuration} 秒
                      </div>
                    </div>
                  </div>

                  {comparisonSummary.mostStable.intersectionId !== comparisonSummary.leastStable.intersectionId && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-0.5">稳定性对比</div>
                        <div className="text-white font-medium">
                          <span style={{ color: comparisonSummary.mostStable.color }} className="font-bold">
                            {comparisonSummary.mostStable.intersectionName}
                          </span>
                          {' '}超限率最低（{comparisonSummary.mostStable.overLimitRate}%），
                          <span style={{ color: comparisonSummary.leastStable.color }}>
                            {comparisonSummary.leastStable.intersectionName}
                          </span>
                          {' '}超限率较高（{comparisonSummary.leastStable.overLimitRate}%）
                        </div>
                      </div>
                    </div>
                  )}

                  {comparisonSummary.bestPeriodByIntersection.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-0.5">最佳通行时段</div>
                        <div className="text-white font-medium space-y-1">
                          {comparisonSummary.bestPeriodByIntersection.map(item => (
                            <div key={item.intersection.id}>
                              <span style={{ color: intersectionStatsMap.get(item.intersection.id)?.color }}>
                                {item.intersection.name}
                              </span>
                              ：{TIME_PERIOD_LABELS[item.bestPeriod]}（平均{item.bestAvg}秒）
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-amber-500/20 text-sm text-slate-400">
                    💡 建议优先选择
                    <span className="text-green-400 font-medium"> {comparisonSummary.fastest.intersectionName} </span>
                    通行，尽量避开
                    <span style={{ color: comparisonSummary.slowest.color }} className="font-medium"> {comparisonSummary.slowest.intersectionName} </span>
                    的高峰时段。
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
