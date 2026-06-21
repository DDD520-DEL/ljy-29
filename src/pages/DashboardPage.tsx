import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, Clock, Timer, MapPin, ChevronRight, TrendingUp, CalendarDays, Sparkles } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { formatDurationWithHours, formatDateTime } from '@/utils/timeUtils';

export default function DashboardPage() {
  const { records, intersections } = useDataStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);

    const sortedRecords = [...records].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    const latestRecord = sortedRecords[0] || null;

    const intersectionCounts = new Map<string, { name: string; count: number }>();
    records.forEach((record) => {
      const existing = intersectionCounts.get(record.intersectionId);
      if (existing) {
        existing.count += 1;
      } else {
        intersectionCounts.set(record.intersectionId, {
          name: record.intersectionName,
          count: 1,
        });
      }
    });

    let mostFrequentIntersection: { name: string; count: number; id: string } | null = null;
    let maxCount = 0;
    intersectionCounts.forEach((data, id) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostFrequentIntersection = { ...data, id };
      }
    });

    return {
      totalRecords,
      totalDuration,
      latestRecord,
      mostFrequentIntersection,
      intersectionCount: intersections.length,
    };
  }, [records, intersections]);

  const statCards = [
    {
      label: '总记录数',
      value: stats.totalRecords.toString(),
      unit: '次',
      icon: ListTodo,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      navigateTo: '/records',
      description: '所有等待记录',
    },
    {
      label: '累计等待',
      value: formatDurationWithHours(stats.totalDuration),
      unit: '',
      icon: Clock,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      navigateTo: '/analysis',
      description: '累计等待总时长',
    },
    {
      label: '最近等待',
      value: stats.latestRecord ? `${stats.latestRecord.duration}秒` : '--',
      unit: '',
      icon: Timer,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      navigateTo: stats.latestRecord ? `/records/${stats.latestRecord.id}` : '/records',
      description: stats.latestRecord ? formatDateTime(stats.latestRecord.startTime) : '暂无记录',
    },
    {
      label: '最频繁路口',
      value: stats.mostFrequentIntersection?.name || '--',
      unit: stats.mostFrequentIntersection ? `${stats.mostFrequentIntersection.count}次` : '',
      icon: MapPin,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      navigateTo: stats.mostFrequentIntersection
        ? `/intersections/${stats.mostFrequentIntersection.id}`
        : '/intersections',
      description: '等待次数最多的路口',
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-900">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">数据概览</h1>
              <p className="text-slate-400 text-sm">一目了然的等待统计</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(card.navigateTo)}
              className={`relative bg-slate-800/50 rounded-2xl p-5 border ${card.borderColor} cursor-pointer 
                hover:bg-slate-800/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                group`}
            >
              <div className={`w-11 h-11 rounded-xl ${card.bgColor} flex items-center justify-center mb-4`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>

              <div className="mb-1">
                <span className="text-sm text-slate-400">{card.label}</span>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-white leading-tight">{card.value}</span>
                {card.unit && (
                  <span className="text-sm font-normal text-slate-400">{card.unit}</span>
                )}
              </div>

              <p className="text-xs text-slate-500 line-clamp-1">{card.description}</p>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/50 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">快速统计</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{stats.intersectionCount}</div>
              <div className="text-xs text-slate-400 mt-1">路口数量</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {stats.totalRecords > 0
                  ? Math.round(stats.totalDuration / stats.totalRecords)
                  : 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">平均等待(秒)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">
                {stats.mostFrequentIntersection?.count || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">最高频次</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-semibold text-white">快捷入口</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/timer')}
              className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 
                hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Timer className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-white">开始计时</div>
                <div className="text-xs text-slate-500">记录等待时长</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/analysis')}
              className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 
                hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-white">数据分析</div>
                <div className="text-xs text-slate-500">查看详细报告</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
