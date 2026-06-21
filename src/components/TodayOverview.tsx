import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock, MapPin, ListChecks } from 'lucide-react';
import { WaitRecord } from '@/types';
import { formatDurationWithHours, formatDate } from '@/utils/timeUtils';

interface TodayOverviewProps {
  records: WaitRecord[];
}

export function TodayOverview({ records }: TodayOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const todayStats = useMemo(() => {
    const todayStr = formatDate(new Date().toISOString());
    const todayRecords = records.filter(r => formatDate(r.startTime) === todayStr);

    const count = todayRecords.length;
    const totalDuration = todayRecords.reduce((sum, r) => sum + r.duration, 0);

    let slowestIntersectionName = '-';
    let slowestDuration = 0;

    if (todayRecords.length > 0) {
      const intersectionMap = new Map<string, { name: string; totalDuration: number }>();
      todayRecords.forEach(record => {
        const existing = intersectionMap.get(record.intersectionId);
        if (existing) {
          existing.totalDuration += record.duration;
        } else {
          intersectionMap.set(record.intersectionId, {
            name: record.intersectionName,
            totalDuration: record.duration,
          });
        }
      });

      let maxDuration = 0;
      let maxName = '-';
      intersectionMap.forEach((value) => {
        if (value.totalDuration > maxDuration) {
          maxDuration = value.totalDuration;
          maxName = value.name;
        }
      });

      slowestIntersectionName = maxName;
      slowestDuration = maxDuration;
    }

    return {
      count,
      totalDuration,
      slowestIntersectionName,
      slowestDuration,
    };
  }, [records]);

  const stats = [
    {
      label: '今日等待次数',
      value: todayStats.count.toString(),
      unit: '次',
      icon: ListChecks,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: '累计等待时长',
      value: formatDurationWithHours(todayStats.totalDuration),
      unit: '',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: '最耗时路口',
      value: todayStats.slowestIntersectionName,
      unit: '',
      subValue: todayStats.slowestDuration > 0 ? formatDurationWithHours(todayStats.slowestDuration) : '',
      icon: MapPin,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden mb-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span className="font-medium text-white">今日概览</span>
          <span className="text-sm text-slate-400">
            {formatDate(new Date().toISOString())}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/30"
              >
                <div className={`w-8 h-8 rounded-md ${stat.bgColor} flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-lg font-bold text-white truncate" title={stat.value}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                {stat.subValue && (
                  <div className="text-xs text-slate-500 mt-0.5">{stat.subValue}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
