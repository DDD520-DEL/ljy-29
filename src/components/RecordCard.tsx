import { Trash2, Tag, FileText, AlertTriangle, Check } from 'lucide-react';
import { WaitRecord, TIME_PERIOD_LABELS, TAG_LABELS } from '@/types';
import { formatDurationWithHours, formatDateTime, getDirectionLabel, getDirectionEmoji } from '@/utils/timeUtils';
import { useDataStore } from '@/store/useDataStore';

interface RecordCardProps {
  record: WaitRecord;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function RecordCard({ record, isMultiSelectMode = false, isSelected = false, onSelect }: RecordCardProps) {
  const { deleteRecord } = useDataStore();

  const handleDelete = () => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteRecord(record.id);
    }
  };

  const handleCardClick = () => {
    if (isMultiSelectMode && onSelect) {
      onSelect(record.id);
    }
  };

  const getDurationColor = (duration: number) => {
    if (duration < 60) return 'text-green-400';
    if (duration < 120) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBorderStyle = () => {
    if (isSelected) return 'border-amber-500 bg-amber-500/10';
    if (record.isOverLimit) return 'border-orange-500/50';
    return 'border-slate-700/50';
  };

  return (
    <div
      className={`bg-slate-800/50 rounded-xl p-4 border transition-all hover:border-slate-600 ${getBorderStyle()} ${
        isMultiSelectMode ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        {isMultiSelectMode && (
          <div
            className={`w-5 h-5 rounded border-2 mr-3 mt-1 flex items-center justify-center flex-shrink-0 transition-colors ${
              isSelected
                ? 'bg-amber-500 border-amber-500'
                : 'border-slate-500 hover:border-slate-400'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={`text-2xl font-bold font-mono ${getDurationColor(record.duration)}`}>
              {formatDurationWithHours(record.duration)}
            </span>
            {record.isOverLimit && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                超限
              </span>
            )}
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
          {(record.tag || record.note) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {record.tag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                  <Tag className="w-3 h-3" />
                  {TAG_LABELS[record.tag]}
                </span>
              )}
              {record.note && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 truncate max-w-[200px]">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{record.note}</span>
                </span>
              )}
            </div>
          )}
        </div>
        {!isMultiSelectMode && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
