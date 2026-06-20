import { Clock, ListChecks, TrendingUp, Award } from 'lucide-react';
import { formatDurationWithHours } from '@/utils/timeUtils';

interface StatsOverviewProps {
  totalRecords: number;
  avgDuration: number;
  maxDuration: number;
  totalDuration: number;
}

export function StatsOverview({ totalRecords, avgDuration, maxDuration, totalDuration }: StatsOverviewProps) {
  const stats = [
    {
      label: '总记录数',
      value: totalRecords.toString(),
      unit: '次',
      icon: ListChecks,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: '平均等待',
      value: avgDuration > 0 ? Math.round(avgDuration).toString() : '0',
      unit: '秒',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: '最长等待',
      value: maxDuration > 0 ? maxDuration.toString() : '0',
      unit: '秒',
      icon: TrendingUp,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      label: '累计等待',
      value: formatDurationWithHours(totalDuration),
      unit: '',
      icon: Award,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
        >
          <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div className="text-2xl font-bold text-white">
            {stat.value}
            <span className="text-sm font-normal text-slate-400 ml-1">{stat.unit}</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
