import { useMemo, useState, useRef, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, Clock, Hash, MapPin, TrendingUp } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDate } from '@/utils/timeUtils';

function getWeekRange(offset: number) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday, end: sunday };
}

function formatShortDate(date: Date): string {
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

function getDayLabel(date: Date): string {
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  return `周${dayNames[date.getDay()]}`;
}

export default function WeeklyReportPage() {
  const { records } = useDataStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const weekLabel = useMemo(() => {
    const s = weekRange.start;
    const e = weekRange.end;
    return `${s.getFullYear()}/${formatShortDate(s)} - ${formatShortDate(e)}`;
  }, [weekRange]);

  const weekRecords = useMemo(() => {
    const startTs = weekRange.start.getTime();
    const endTs = new Date(weekRange.end.getTime() + 24 * 60 * 60 * 1000).getTime();
    return records.filter(r => {
      const t = new Date(r.startTime).getTime();
      return t >= startTs && t < endTs;
    });
  }, [records, weekRange]);

  const totalCount = weekRecords.length;

  const dailyAvgDuration = useMemo(() => {
    if (weekRecords.length === 0) return 0;
    const totalDuration = weekRecords.reduce((sum, r) => sum + r.duration, 0);
    const daysWithData = new Set(weekRecords.map(r => formatDate(r.startTime))).size;
    return daysWithData > 0 ? Math.round(totalDuration / daysWithData) : 0;
  }, [weekRecords]);

  const mostFrequentIntersection = useMemo(() => {
    if (weekRecords.length === 0) return null;
    const countMap = new Map<string, { name: string; count: number }>();
    weekRecords.forEach(r => {
      const existing = countMap.get(r.intersectionId);
      if (existing) {
        existing.count += 1;
      } else {
        countMap.set(r.intersectionId, { name: r.intersectionName, count: 1 });
      }
    });
    let best: { id: string; name: string; count: number } | null = null;
    countMap.forEach((val, key) => {
      if (!best || val.count > best.count) {
        best = { id: key, name: val.name, count: val.count };
      }
    });
    return best;
  }, [weekRecords]);

  const dailyTrendData = useMemo(() => {
    const data: { day: string; date: string; duration: number; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekRange.start);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d.toISOString());
      const dayRecords = weekRecords.filter(r => formatDate(r.startTime) === dateStr);
      const avgDuration = dayRecords.length > 0
        ? Math.round(dayRecords.reduce((sum, r) => sum + r.duration, 0) / dayRecords.length)
        : 0;
      data.push({
        day: getDayLabel(d),
        date: formatShortDate(d),
        duration: avgDuration,
        count: dayRecords.length,
      });
    }
    return data;
  }, [weekRecords, weekRange]);

  const maxDuration = useMemo(() => {
    return Math.max(...dailyTrendData.map(d => d.duration), 1);
  }, [dailyTrendData]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && weekOffset < 0) {
        setWeekOffset(prev => prev + 1);
      } else if (deltaX < 0) {
        setWeekOffset(prev => prev - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [weekOffset]);

  const goPrevWeek = () => {
    if (weekOffset < 0) setWeekOffset(prev => prev + 1);
  };

  const goNextWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">每周摘要</h1>
          <p className="text-slate-400 text-sm">一周等待数据总览</p>
        </div>

        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="mb-6"
        >
          <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <button
              type="button"
              onClick={goPrevWeek}
              disabled={weekOffset >= 0}
              className={`p-2 rounded-lg transition-colors ${
                weekOffset >= 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:bg-slate-700 active:bg-slate-600'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-white font-medium">{weekLabel}</span>
            </div>

            <button
              type="button"
              onClick={goNextWeek}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-700 active:bg-slate-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center mt-2">左右滑动切换历史周</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Hash className="w-4 h-4" />
              等待总次数
            </div>
            <div className="text-3xl font-bold text-white">
              {totalCount}
              <span className="text-sm font-normal text-slate-400 ml-1">次</span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              日均等待时长
            </div>
            <div className="text-3xl font-bold text-white">
              {dailyAvgDuration}
              <span className="text-sm font-normal text-slate-400 ml-1">秒</span>
            </div>
          </div>
        </div>

        {mostFrequentIntersection && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">最常经过路口</span>
            </div>
            <div className="text-xl font-bold text-white mb-1 truncate">
              {mostFrequentIntersection.name}
            </div>
            <div className="text-sm text-slate-300">
              本周经过 <span className="text-blue-400 font-bold">{mostFrequentIntersection.count}</span> 次
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">本周等待时长日趋势</h2>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <Area
                    type="monotone"
                    dataKey="duration"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#weekGradient)"
                    dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                  />
                  <defs>
                    <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-7 gap-1 mt-2">
              {dailyTrendData.map((d) => (
                <div key={d.day} className="text-center">
                  <div className="text-xs text-slate-400 mb-0.5">{d.day}</div>
                  <div
                    className="mx-auto w-1.5 rounded-full transition-all"
                    style={{
                      height: `${Math.max(Math.round((d.duration / maxDuration) * 32), d.count > 0 ? 4 : 0)}px`,
                      backgroundColor: d.duration > 0 ? '#f59e0b' : '#334155',
                      opacity: d.duration > 0 ? 1 : 0.3,
                    }}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {d.duration > 0 ? `${d.duration}s` : '-'}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mt-3 pt-3 border-t border-slate-700/50">
              {dailyTrendData.map((d) => (
                <div key={d.day} className="text-center">
                  <div className="text-xs text-slate-500">{d.count > 0 ? `${d.count}次` : '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {weekRecords.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-white font-medium mb-3">本周详情</h3>
            <div className="space-y-2">
              {(() => {
                const intersectionMap = new Map<string, { name: string; count: number; totalDuration: number }>();
                weekRecords.forEach(r => {
                  const existing = intersectionMap.get(r.intersectionId);
                  if (existing) {
                    existing.count += 1;
                    existing.totalDuration += r.duration;
                  } else {
                    intersectionMap.set(r.intersectionId, {
                      name: r.intersectionName,
                      count: 1,
                      totalDuration: r.duration,
                    });
                  }
                });
                const sorted = Array.from(intersectionMap.entries())
                  .map(([, v]) => v)
                  .sort((a, b) => b.count - a.count);

                return sorted.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        平均 {Math.round(item.totalDuration / item.count)} 秒
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-amber-400">{item.count}</div>
                      <div className="text-xs text-slate-500">次</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {weekRecords.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Calendar className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">本周暂无记录</p>
            <p className="text-sm">开始记录你的等待时长吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
