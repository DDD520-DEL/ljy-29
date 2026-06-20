import { useMemo, useState } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Trophy, Clock, TrendingUp, AlertTriangle, Tag } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { TIME_PERIOD_LABELS, TimePeriod, TAG_OPTIONS, TAG_LABELS, Tag as TagType } from '@/types';
import { formatDate, getDaysAgoDate, isSameDay } from '@/utils/timeUtils';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function AnalysisPage() {
  const { records, intersections } = useDataStore();
  const [timeRange, setTimeRange] = useState<'7' | '30'>('30');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const baseFilteredRecords = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoffDate = getDaysAgoDate(days);
    return records.filter(r => new Date(r.startTime) >= cutoffDate);
  }, [records, timeRange]);

  const filteredRecords = useMemo(() => {
    if (selectedTag === 'all') return baseFilteredRecords;
    return baseFilteredRecords.filter(r => r.tag === selectedTag);
  }, [baseFilteredRecords, selectedTag]);

  const intersectionStats = useMemo(() => {
    const statsMap = new Map<string, { name: string; total: number; count: number; max: number }>();

    filteredRecords.forEach((record) => {
      const existing = statsMap.get(record.intersectionId);
      if (existing) {
        existing.total += record.duration;
        existing.count += 1;
        existing.max = Math.max(existing.max, record.duration);
      } else {
        statsMap.set(record.intersectionId, {
          name: record.intersectionName,
          total: record.duration,
          count: 1,
          max: record.duration,
        });
      }
    });

    return Array.from(statsMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        avg: Math.round(data.total / data.count),
        count: data.count,
        max: data.max,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [filteredRecords]);

  const periodStats = useMemo(() => {
    const periodMap = new Map<TimePeriod, { total: number; count: number }>();

    filteredRecords.forEach((record) => {
      const existing = periodMap.get(record.timePeriod);
      if (existing) {
        existing.total += record.duration;
        existing.count += 1;
      } else {
        periodMap.set(record.timePeriod, { total: record.duration, count: 1 });
      }
    });

    const periodOrder: TimePeriod[] = ['morning_peak', 'flat', 'evening_peak', 'night'];
    return periodOrder
      .filter(p => periodMap.has(p))
      .map((period) => {
        const data = periodMap.get(period)!;
        return {
          period: TIME_PERIOD_LABELS[period],
          平均时长: Math.round(data.total / data.count),
          记录次数: data.count,
        };
      });
  }, [filteredRecords]);

  const tagStats = useMemo(() => {
    const tagMap = new Map<string, { total: number; count: number }>();

    baseFilteredRecords.forEach((record) => {
      const tagKey = record.tag || 'untagged';
      const existing = tagMap.get(tagKey);
      if (existing) {
        existing.total += record.duration;
        existing.count += 1;
      } else {
        tagMap.set(tagKey, { total: record.duration, count: 1 });
      }
    });

    return TAG_OPTIONS
      .filter(opt => tagMap.has(opt.value))
      .map((opt) => {
        const data = tagMap.get(opt.value)!;
        return {
          tag: opt.value,
          label: opt.label,
          avg: Math.round(data.total / data.count),
          count: data.count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [baseFilteredRecords]);

  const dailyTrend = useMemo(() => {
    const days = parseInt(timeRange);
    const dailyMap = new Map<string, number[]>();

    for (let i = days - 1; i >= 0; i--) {
      const date = getDaysAgoDate(i);
      const key = formatDate(date.toISOString());
      dailyMap.set(key, []);
    }

    filteredRecords.forEach((record) => {
      const date = new Date(record.startTime);
      const key = formatDate(record.startTime);
      if (dailyMap.has(key)) {
        dailyMap.get(key)!.push(record.duration);
      }
    });

    return Array.from(dailyMap.entries()).map(([date, durations]) => ({
      date: date.slice(5),
      平均时长: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      记录次数: durations.length,
    }));
  }, [filteredRecords, timeRange]);

  const worstIntersection = intersectionStats[0];
  const overallAvg = filteredRecords.length > 0
    ? Math.round(filteredRecords.reduce((sum, r) => sum + r.duration, 0) / filteredRecords.length)
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name.includes('次数') ? '次' : '秒'}
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">数据分析</h1>
          <p className="text-slate-400 text-sm">看看哪些路口最让人抓狂</p>
        </div>

        <div className="flex gap-2 mb-4">
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

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">按标签筛选</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedTag === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              全部
            </button>
            {TAG_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedTag(selectedTag === option.value ? 'all' : option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedTag === option.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {worstIntersection && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-amber-500/20 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">最不合理路口</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">{worstIntersection.name}</div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-300">
                平均等待 <span className="text-red-400 font-bold">{worstIntersection.avg}</span> 秒
              </span>
              <span className="text-slate-400">
                {worstIntersection.count} 次记录
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              整体平均
            </div>
            <div className="text-3xl font-bold text-white">
              {overallAvg}<span className="text-sm font-normal text-slate-400 ml-1">秒</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Trophy className="w-4 h-4" />
              路口数量
            </div>
            <div className="text-3xl font-bold text-white">
              {intersectionStats.length}<span className="text-sm font-normal text-slate-400 ml-1">个</span>
            </div>
          </div>
        </div>

        {tagStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              标签平均等待时长
            </h2>
            <div className="space-y-2">
              {tagStats.map((item, index) => (
                <div
                  key={item.tag}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center gap-4"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: COLORS[index % COLORS.length] + '30', color: COLORS[index % COLORS.length] }}
                  >
                    {item.label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{item.label}</div>
                    <div className="text-xs text-slate-400">{item.count} 次记录</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-400">{item.avg}s</div>
                    <div className="text-xs text-slate-500">平均</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            路口等待时长排名
          </h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            {intersectionStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={intersectionStats.slice(0, 6)}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      width={100}
                      tickFormatter={(value) => value.length > 8 ? value.slice(0, 8) + '...' : value}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {intersectionStats.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
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

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">时段对比</h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            {periodStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodStats} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="平均时长" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">每日趋势</h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            {dailyTrend.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="平均时长"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
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

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">路口排行榜</h2>
          <div className="space-y-2">
            {intersectionStats.slice(0, 5).map((item, index) => (
              <div
                key={item.id}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center gap-4"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? 'bg-yellow-500 text-yellow-900'
                      : index === 1
                      ? 'bg-slate-400 text-slate-800'
                      : index === 2
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.count} 次记录</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400">{item.avg}s</div>
                  <div className="text-xs text-slate-500">平均</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
