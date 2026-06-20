import { Trash2 } from 'lucide-react';
import { WaitRecord, TIME_PERIOD_LABELS } from '@/types';
import { formatDurationWithHours, formatDateTime, getDirectionLabel, getDirectionEmoji } from '@/utils/timeUtils';
import { useDataStore } from '@/store/useDataStore';

interface RecordCardProps {
  record: WaitRecord;
}

export function RecordCard({ record }: RecordCardProps) {
  const { deleteRecord } = useDataStore();

  const handleDelete = () => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteRecord(record.id);
    }
  };

  const getDurationColor = (duration: number) => {
    if (duration < 60) return 'text-green-400';
    if (duration < 120) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-2xl font-bold font-mono ${getDurationColor(record.duration)}`}>
              {formatDurationWithHours(record.duration)}
            </span>
            <span className="text-slate-500 text-sm">
              {getDirectionEmoji(record.direction)} {getDirectionLabel(record.direction)}方向
            </span>
          </div>
          <div className="text-white font-medium mb-1">{record.intersectionName}</div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>{formatDateTime(record.startTime)}</span>
            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">
              {TIME_PERIOD_LABELS[record.timePeriod]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
