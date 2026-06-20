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
  Cell,
} from 'recharts';
import { Trophy, Clock, TrendingUp, AlertTriangle, Tag, Folder, Award, Lightbulb, BarChart3 } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { TIME_PERIOD_LABELS, TimePeriod, TAG_OPTIONS, TAG_LABELS, Tag as TagType, GroupStats, GRADE_LABELS, GRADE_COLORS } from '@/types';
import { formatDate, getDaysAgoDate, isSameDay } from '@/utils/timeUtils';
import IntersectionRankingShare from '@/components/IntersectionRankingShare';
import type { RankItem } from '@/utils/shareUtils';
import { calculateAllTimingScores } from '@/utils/timingScore';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function AnalysisPage() {
  const { records, intersections, groups } = useDataStore();
  const [timeRange, setTimeRange] = useState<'7' | '30'>('30');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [expandedScoreId, setExpandedScoreId] = useState<string | null>(null);

  const baseFilteredRecords = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoffDate = getDaysAgoDate(days);
    return records.filter(r => new Date(r.startTime) >= cutoffDate);
  }, [records, timeRange]);

  const filteredRecords = useMemo(() => {
    let result = baseFilteredRecords;
    if (selectedTag !== 'all') {
      result = result.filter(r => r.tag === selectedTag);
    }
    if (selectedGroupFilter !== 'all') {
      const group = groups.find(g => g.id === selectedGroupFilter);
      if (group) {
        result = result.filter(r => group.intersectionIds.includes(r.intersectionId));
      }
    }
    return result;
  }, [baseFilteredRecords, selectedTag, selectedGroupFilter, groups]);

  const groupStats = useMemo((): GroupStats[] => {
    return groups
      .filter(group => group.intersectionIds.length > 0)
      .map((group) => {
        const groupRecords = baseFilteredRecords.filter(r => group.intersectionIds.includes(r.intersectionId));
        const durations = groupRecords.map(r => r.duration);
        const totalDuration = durations.reduce((sum, d) => sum + d, 0);
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

        return {
          groupId: group.id,
          groupName: group.name,
          color: group.color,
          intersectionCount: group.intersectionIds.length,
          recordCount: groupRecords.length,
          avgDuration: groupRecords.length > 0 ? Math.round(totalDuration / groupRecords.length) : 0,
          maxDuration,
          totalDuration,
        };
      })
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }, [baseFilteredRecords, groups]);

  const intersectionStats = useMemo(() => {
    const statsMap = new Map<string, { name: string; total: number; count: number; max: number; overLimitCount: number }>();

    filteredRecords.forEach((record) => {
      const existing = statsMap.get(record.intersectionId);
      if (existing) {
        existing.total += record.duration;
        existing.count += 1;
        existing.max = Math.max(existing.max, record.duration);
        if (record.isOverLimit) {
          existing.overLimitCount += 1;
        }
      } else {
        statsMap.set(record.intersectionId, {
          name: record.intersectionName,
          total: record.duration,
          count: 1,
          max: record.duration,
          overLimitCount: record.isOverLimit ? 1 : 0,
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
        overLimitCount: data.overLimitCount,
        overLimitRate: data.count > 0 ? Math.round((data.overLimitCount / data.count) * 100) : 0,
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
  const worstGroup = groupStats[0];
  const overallAvg = filteredRecords.length > 0
    ? Math.round(filteredRecords.reduce((sum, r) => sum + r.duration, 0) / filteredRecords.length)
    : 0;

  const totalOverLimitCount = filteredRecords.filter(r => r.isOverLimit).length;
  const overallOverLimitRate = filteredRecords.length > 0
    ? Math.round((totalOverLimitCount / filteredRecords.length) * 100)
    : 0;

  const computeRankingItems = (days: number, allRecords: typeof records): RankItem[] => {
    const cutoffDate = getDaysAgoDate(days);
    const periodRecords = allRecords.filter(r => new Date(r.startTime) >= cutoffDate);
    const statsMap = new Map<string, { name: string; total: number; count: number }>();

    periodRecords.forEach((record) => {
      const existing = statsMap.get(record.intersectionId);
      if (existing) {
        existing.total += record.duration;
        existing.count += 1;
      } else {
        statsMap.set(record.intersectionId, {
          name: record.intersectionName,
          total: record.duration,
          count: 1,
        });
      }
    });

    return Array.from(statsMap.entries())
      .map(([, data]) => ({
        name: data.name,
        avgDuration: Math.round(data.total / data.count),
        recordCount: data.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  };

  const weekRankingItems = useMemo(() => computeRankingItems(7, records), [records]);
  const monthRankingItems = useMemo(() => computeRankingItems(30, records), [records]);

  const timingScores = useMemo(() => {
    return calculateAllTimingScores(intersections, records);
  }, [intersections, records]);

  const timingScoreList = useMemo(() => {
    return Array.from(timingScores.values())
      .sort((a, b) => a.totalScore - b.totalScore);
  }, [timingScores]);

  const worstTimingScore = timingScoreList[0];
  const bestTimingScore = timingScoreList[timingScoreList.length - 1];

  const toggleScoreExpand = (intersectionId: string) => {
    setExpandedScoreId(expandedScoreId === intersectionId ? null : intersectionId);
  };

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

        {groups.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">按分组筛选</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedGroupFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedGroupFilter === 'all'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                全部
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupFilter(selectedGroupFilter === group.id ? 'all' : group.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors`}
                  style={{
                    backgroundColor: selectedGroupFilter === group.id ? group.color : group.color + '25',
                    color: selectedGroupFilter === group.id ? 'white' : group.color,
                  }}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        )}

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

        {worstGroup && selectedGroupFilter === 'all' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">最耗时分组</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">{worstGroup.groupName}</div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-300">
                平均等待 <span className="text-blue-400 font-bold">{worstGroup.avgDuration}</span> 秒
              </span>
              <span className="text-slate-400">
                {worstGroup.recordCount} 次记录 · {worstGroup.intersectionCount} 个路口
              </span>
            </div>
          </div>
        )}

        {worstIntersection && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-amber-500/20 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">最不合理路口</span>
            </div>
            <div className="text-xl font-bold text-white mb-1">{worstIntersection.name}</div>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-slate-300">
                平均等待 <span className="text-red-400 font-bold">{worstIntersection.avg}</span> 秒
              </span>
              <span className="text-slate-400">
                {worstIntersection.count} 次记录
              </span>
              {worstIntersection.overLimitCount > 0 && (
                <span className="text-orange-400">
                  超限 {worstIntersection.overLimitCount} 次 ({worstIntersection.overLimitRate}%)
                </span>
              )}
            </div>
          </div>
        )}

        {worstTimingScore && selectedGroupFilter === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">配时最差路口</span>
              </div>
              <div className="text-lg font-bold text-white mb-1 truncate">{worstTimingScore.intersectionName}</div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl font-bold" style={{ color: GRADE_COLORS[worstTimingScore.grade] }}>
                  {worstTimingScore.totalScore}
                </span>
                <span className="text-slate-400">
                  {GRADE_LABELS[worstTimingScore.grade]}
                </span>
              </div>
            </div>
            {bestTimingScore && bestTimingScore.intersectionId !== worstTimingScore.intersectionId && (
              <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">配时最优路口</span>
                </div>
                <div className="text-lg font-bold text-white mb-1 truncate">{bestTimingScore.intersectionName}</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-2xl font-bold" style={{ color: GRADE_COLORS[bestTimingScore.grade] }}>
                    {bestTimingScore.totalScore}
                  </span>
                  <span className="text-slate-400">
                    {GRADE_LABELS[bestTimingScore.grade]}
                  </span>
                </div>
              </div>
            )}
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
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Folder className="w-4 h-4" />
              分组数量
            </div>
            <div className="text-3xl font-bold text-white">
              {groupStats.length}<span className="text-sm font-normal text-slate-400 ml-1">个</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Trophy className="w-4 h-4" />
              总记录数
            </div>
            <div className="text-3xl font-bold text-white">
              {filteredRecords.length}<span className="text-sm font-normal text-slate-400 ml-1">条</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-orange-500/30">
            <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              超限次数
            </div>
            <div className="text-3xl font-bold text-orange-400">
              {totalOverLimitCount}<span className="text-sm font-normal text-slate-400 ml-1">次</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-orange-500/30">
            <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              超限率
            </div>
            <div className="text-3xl font-bold text-orange-400">
              {overallOverLimitRate}<span className="text-sm font-normal text-slate-400 ml-1">%</span>
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

        {groupStats.length > 0 && selectedGroupFilter === 'all' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-amber-400" />
              分组平均等待时长
            </h2>
            <div className="space-y-2">
              {groupStats.map((item, index) => (
                <div
                  key={item.groupId}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex items-center gap-4"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: item.color + '30', color: item.color }}
                  >
                    {item.groupName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{item.groupName}</div>
                    <div className="text-xs text-slate-400">{item.recordCount} 次记录 · {item.intersectionCount} 个路口</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: item.color }}>{item.avgDuration}s</div>
                    <div className="text-xs text-slate-500">平均</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupStats.length > 0 && selectedGroupFilter === 'all' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              分组等待时长排名
            </h2>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={groupStats.slice(0, 6)}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="groupName"
                      stroke="#94a3b8"
                      fontSize={11}
                      width={100}
                      tickFormatter={(value) => value.length > 8 ? value.slice(0, 8) + '...' : value}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgDuration" name="平均时长" radius={[0, 4, 4, 0]}>
                      {groupStats.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            路口超限次数排名
          </h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            {intersectionStats.filter(s => s.overLimitCount > 0).length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={intersectionStats.filter(s => s.overLimitCount > 0).sort((a, b) => b.overLimitCount - a.overLimitCount).slice(0, 6)}
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
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                              <p className="text-white font-medium">{label}</p>
                              <p className="text-sm text-orange-400">超限次数: {data.overLimitCount}次</p>
                              <p className="text-sm text-slate-400">超限率: {data.overLimitRate}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="overLimitCount" name="超限次数" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                暂无超限数据
              </div>
            )}
          </div>
        </div>

        {timingScoreList.length > 0 && selectedGroupFilter === 'all' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              配时合理性评分排名
            </h2>
            <div className="space-y-3">
              {timingScoreList.map((score, index) => {
                const isExpanded = expandedScoreId === score.intersectionId;
                return (
                  <div
                    key={score.intersectionId}
                    className="bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleScoreExpand(score.intersectionId)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: GRADE_COLORS[score.grade] }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{score.intersectionName}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: GRADE_COLORS[score.grade] + '20', color: GRADE_COLORS[score.grade] }}
                            >
                              {GRADE_LABELS[score.grade]}
                            </span>
                            <span className="text-xs text-slate-400">
                              {score.details.recordCount} 条记录
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: GRADE_COLORS[score.grade] }}>
                            {score.totalScore}
                          </div>
                          <div className="text-xs text-slate-500">分</div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-700/50 px-4 py-4 bg-slate-900/30">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-white">评分详情</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">平均时长</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.avgDurationScore}</span>
                                <span className="text-xs text-slate-500">{score.details.avgDuration}s</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.avgDurationScore}%`, backgroundColor: '#3b82f6' }}
                                />
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">峰谷差异</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.peakValleyScore}</span>
                                <span className="text-xs text-slate-500">峰{score.details.peakAvg}s</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.peakValleyScore}%`, backgroundColor: '#8b5cf6' }}
                                />
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">稳定性</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.varianceScore}</span>
                                <span className="text-xs text-slate-500">方差{score.details.variance}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.varianceScore}%`, backgroundColor: '#10b981' }}
                                />
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">超限率</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.overLimitScore}</span>
                                <span className="text-xs text-slate-500">{score.details.overLimitRate}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.overLimitScore}%`, backgroundColor: '#f59e0b' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-white">优化建议</span>
                          </div>
                          <div className="space-y-2">
                            {score.suggestions.map((suggestion, sIndex) => (
                              <div
                                key={sIndex}
                                className="flex items-start gap-2 text-sm text-slate-300 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3"
                              >
                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {sIndex + 1}
                                </span>
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

        <IntersectionRankingShare
          weekItems={weekRankingItems}
          monthItems={monthRankingItems}
        />
      </div>
    </div>
  );
}
