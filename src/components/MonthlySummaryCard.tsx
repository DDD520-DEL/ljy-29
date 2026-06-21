import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Download, Clock, MapPin, CalendarDays, TrendingUp, TrendingDown, Minus, Loader2, Check } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDurationWithHours, formatDate } from '@/utils/timeUtils';
import { generateMonthlySummaryImage, downloadImage } from '@/utils/shareUtils';

const STORAGE_KEY_SHOWN = 'monthly_summary_shown';

interface MonthlyStats {
  totalDuration: number;
  topIntersections: { name: string; totalDuration: number; recordCount: number }[];
  recordDays: number;
  lastMonthTotalDuration: number;
  lastMonthRecordDays: number;
}

function isLastDayOfMonth(date: Date): boolean {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getMonth() !== date.getMonth();
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function wasShownThisMonth(): boolean {
  try {
    const shown = localStorage.getItem(STORAGE_KEY_SHOWN);
    return shown === getMonthKey(new Date());
  } catch {
    return false;
  }
}

function markShownThisMonth(): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHOWN, getMonthKey(new Date()));
  } catch {
    console.warn('Failed to save monthly summary shown state');
  }
}

function computeMonthlyStats(
  records: { startTime: string; duration: number; intersectionId: string; intersectionName: string }[],
  year: number,
  month: number
): MonthlyStats {
  const filtered = records.filter((r) => {
    const d = new Date(r.startTime);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalDuration = filtered.reduce((sum, r) => sum + r.duration, 0);

  const intersectionMap = new Map<string, { name: string; totalDuration: number; recordCount: number }>();
  filtered.forEach((r) => {
    const existing = intersectionMap.get(r.intersectionId);
    if (existing) {
      existing.totalDuration += r.duration;
      existing.recordCount += 1;
    } else {
      intersectionMap.set(r.intersectionId, {
        name: r.intersectionName,
        totalDuration: r.duration,
        recordCount: 1,
      });
    }
  });

  const topIntersections = Array.from(intersectionMap.values())
    .sort((a, b) => b.totalDuration - a.totalDuration)
    .slice(0, 3);

  const daySet = new Set<string>();
  filtered.forEach((r) => daySet.add(formatDate(r.startTime)));
  const recordDays = daySet.size;

  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }

  const prevFiltered = records.filter((r) => {
    const d = new Date(r.startTime);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  const lastMonthTotalDuration = prevFiltered.reduce((sum, r) => sum + r.duration, 0);
  const prevDaySet = new Set<string>();
  prevFiltered.forEach((r) => prevDaySet.add(formatDate(r.startTime)));
  const lastMonthRecordDays = prevDaySet.size;

  return {
    totalDuration,
    topIntersections,
    recordDays,
    lastMonthTotalDuration,
    lastMonthRecordDays,
  };
}

function TrendIndicator({ current, previous, label }: { current: number; previous: number; label: string }) {
  if (previous === 0 && current === 0) {
    return (
      <div className="flex items-center gap-1 text-slate-500">
        <Minus className="w-3.5 h-3.5" />
        <span className="text-xs">暂无对比</span>
      </div>
    );
  }

  if (previous === 0) {
    return (
      <div className="flex items-center gap-1 text-blue-400">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="text-xs">新增</span>
      </div>
    );
  }

  const changePercent = Math.round(((current - previous) / previous) * 100);

  if (label === '等待时长') {
    const isUp = changePercent > 0;
    const Icon = isUp ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;
    const color = isUp ? 'text-red-400' : changePercent < 0 ? 'text-green-400' : 'text-slate-400';
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{changePercent > 0 ? '+' : ''}{changePercent}%</span>
      </div>
    );
  }

  const isUp = changePercent > 0;
  const UpIcon = isUp ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;
  const upColor = isUp ? 'text-green-400' : changePercent < 0 ? 'text-red-400' : 'text-slate-400';
  return (
    <div className={`flex items-center gap-1 ${upColor}`}>
      <UpIcon className="w-3.5 h-3.5" />
      <span className="text-xs">{changePercent > 0 ? '+' : ''}{changePercent}%</span>
    </div>
  );
}

const RANK_STYLES = [
  { bg: 'bg-yellow-500', text: 'text-yellow-900', bar: 'bg-yellow-500' },
  { bg: 'bg-slate-400', text: 'text-slate-800', bar: 'bg-slate-400' },
  { bg: 'bg-amber-700', text: 'text-amber-100', bar: 'bg-amber-700' },
];

export default function MonthlySummaryCard() {
  const { records } = useDataStore();
  const [isVisible, setIsVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  useEffect(() => {
    const currentDate = new Date();
    if (isLastDayOfMonth(currentDate) && !wasShownThisMonth()) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        markShownThisMonth();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const stats = useMemo(
    () => computeMonthlyStats(records, currentYear, currentMonth),
    [records, currentYear, currentMonth]
  );

  const lastMonthStats = useMemo(() => {
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    return computeMonthlyStats(records, prevYear, prevMonth);
  }, [records, currentYear, currentMonth]);

  const monthLabel = `${currentYear}年${currentMonth + 1}月`;
  const maxDuration = stats.topIntersections.length > 0
    ? Math.max(...stats.topIntersections.map((i) => i.totalDuration))
    : 0;

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleSaveAsImage = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const blob = await generateMonthlySummaryImage({
        monthLabel,
        totalDuration: stats.totalDuration,
        topIntersections: stats.topIntersections,
        recordDays: stats.recordDays,
        lastMonthTotalDuration: lastMonthStats.totalDuration,
        lastMonthRecordDays: lastMonthStats.recordDays,
        generatedAt: formatDate(new Date().toISOString()),
      });
      downloadImage(blob, `月度总结-${monthLabel}.png`);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [monthLabel, stats, lastMonthStats]);

  if (!isVisible) return null;

  const hasData = stats.totalDuration > 0 || stats.recordDays > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div
        className="relative w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
      >
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent pointer-events-none" />

          <div className="relative flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <CalendarDays className="w-4.5 h-4.5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">月度总结</h2>
              </div>
              <p className="text-sm text-slate-400 ml-10">{monthLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-4 space-y-4">
          {hasData ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-400">等待总时长</span>
                  </div>
                  <div className="text-xl font-bold text-white leading-tight">
                    {formatDurationWithHours(stats.totalDuration)}
                  </div>
                  <div className="mt-1.5">
                    <TrendIndicator
                      current={stats.totalDuration}
                      previous={lastMonthStats.totalDuration}
                      label="等待时长"
                    />
                  </div>
                </div>

                <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-400">记录天数</span>
                  </div>
                  <div className="text-xl font-bold text-white leading-tight">
                    {stats.recordDays}<span className="text-sm font-normal text-slate-400 ml-1">天</span>
                  </div>
                  <div className="mt-1.5">
                    <TrendIndicator
                      current={stats.recordDays}
                      previous={lastMonthStats.recordDays}
                      label="记录天数"
                    />
                  </div>
                </div>
              </div>

              {stats.topIntersections.length > 0 && (
                <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">最耗时路口 Top {stats.topIntersections.length}</span>
                  </div>
                  <div className="space-y-3">
                    {stats.topIntersections.map((intersection, index) => {
                      const style = RANK_STYLES[index] || RANK_STYLES[2];
                      const barWidth = maxDuration > 0
                        ? Math.max((intersection.totalDuration / maxDuration) * 100, 15)
                        : 15;
                      return (
                        <div key={intersection.name + index}>
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={`w-6 h-6 rounded-full ${style.bg} ${style.text} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                              {index + 1}
                            </div>
                            <span className="text-sm text-white truncate flex-1">{intersection.name}</span>
                            <span className="text-sm font-semibold text-amber-400 flex-shrink-0">
                              {formatDurationWithHours(intersection.totalDuration)}
                            </span>
                          </div>
                          <div className="ml-8 h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <div className="ml-8 mt-0.5 text-xs text-slate-500">
                            {intersection.recordCount} 次记录
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">本月暂无等待记录</p>
              <p className="text-slate-500 text-xs mt-1">开始记录你的等待时间吧</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={handleSaveAsImage}
            disabled={saveStatus === 'saving'}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
              saveStatus === 'saved'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : saveStatus === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25'
            }`}
          >
            {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveStatus === 'saved' && <Check className="w-4 h-4" />}
            {saveStatus === 'idle' && <Download className="w-4 h-4" />}
            {saveStatus === 'saving' ? '生成中...' : saveStatus === 'saved' ? '已保存' : saveStatus === 'error' ? '保存失败，请重试' : '保存为图片'}
          </button>
        </div>
      </div>
    </div>
  );
}
