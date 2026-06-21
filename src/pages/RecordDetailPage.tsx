import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Clock,
  Calendar,
  Tag,
  FileText,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import {
  TIME_PERIOD_LABELS,
  TAG_LABELS,
  Intersection,
} from '@/types';
import {
  formatDurationWithHours,
  formatDateTime,
  getDirectionLabel,
  getDirectionEmoji,
} from '@/utils/timeUtils';

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { records, intersections, deleteRecord } = useDataStore();

  const record = useMemo(() => {
    return records.find((r) => r.id === id);
  }, [records, id]);

  const intersection = useMemo((): Intersection | undefined => {
    if (!record) return undefined;
    return intersections.find((i) => i.id === record.intersectionId);
  }, [intersections, record]);

  const intersectionStats = useMemo(() => {
    if (!record) return null;
    const sameIntersectionRecords = records.filter(
      (r) => r.intersectionId === record.intersectionId && r.id !== record.id
    );
    if (sameIntersectionRecords.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        overLimitCount: 0,
      };
    }
    const durations = sameIntersectionRecords.map((r) => r.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    return {
      count: sameIntersectionRecords.length,
      avgDuration: Math.round(total / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      overLimitCount: sameIntersectionRecords.filter((r) => r.isOverLimit).length,
    };
  }, [records, record]);

  if (!record) {
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            type="button"
            onClick={() => navigate('/records')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回记录列表
          </button>
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-white font-medium mb-2">记录不存在</p>
            <p className="text-slate-500 text-sm">该记录可能已被删除</p>
          </div>
        </div>
      </div>
    );
  }

  const getDurationColor = (duration: number) => {
    if (duration < 60) return 'text-green-400';
    if (duration < 120) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBgColorClass = (duration: number) => {
    if (duration < 60) return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    if (duration < 120) return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
    return 'from-red-500/20 to-rose-500/20 border-red-500/30';
  };

  const durationDiff = intersectionStats && intersectionStats.avgDuration > 0
    ? record.duration - intersectionStats.avgDuration
    : 0;
  const durationDiffPercent = intersectionStats && intersectionStats.avgDuration > 0
    ? Math.round((durationDiff / intersectionStats.avgDuration) * 100)
    : 0;

  const handleDelete = () => {
    if (confirm('确定要删除这条记录吗？此操作不可恢复。')) {
      deleteRecord(record.id);
      navigate('/records');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate('/records')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回记录列表
        </button>

        <div
          className={`rounded-2xl p-6 mb-6 border bg-gradient-to-br ${getBgColorClass(record.duration)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-300" />
              <span className="text-slate-300 text-sm">等待地点</span>
            </div>
            {record.isOverLimit && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500/30 text-orange-300 rounded-lg text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                超过合理时长
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {record.intersectionName}
          </h1>
          {intersection?.area && (
            <p className="text-slate-400 text-sm mb-4">{intersection.area}</p>
          )}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-4xl">{getDirectionEmoji(record.direction)}</span>
            <span className="text-lg text-slate-300">
              {getDirectionLabel(record.direction)}方向行驶
            </span>
          </div>

          <div className="text-center py-6 bg-slate-900/40 rounded-xl">
            <div className="text-slate-400 text-sm mb-2">本次等待时长</div>
            <div className={`text-5xl font-bold font-mono mb-2 ${getDurationColor(record.duration)}`}>
              {formatDurationWithHours(record.duration)}
            </div>
            {intersectionStats && intersectionStats.avgDuration > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm">
                {durationDiff > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">
                      比历史平均多 {formatDurationWithHours(Math.abs(durationDiff))} ({durationDiffPercent > 0 ? '+' : ''}{durationDiffPercent}%)
                    </span>
                  </>
                ) : durationDiff < 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-400 rotate-180" />
                    <span className="text-green-400">
                      比历史平均少 {formatDurationWithHours(Math.abs(durationDiff))} ({durationDiffPercent}%)
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">与历史平均持平</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              时间信息
            </h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>开始时间</span>
              </div>
              <span className="text-white font-medium">
                {formatDateTime(record.startTime)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>结束时间</span>
              </div>
              <span className="text-white font-medium">
                {formatDateTime(record.endTime)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Navigation className="w-4 h-4" />
                <span>所属时段</span>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                {TIME_PERIOD_LABELS[record.timePeriod]}
              </span>
            </div>
          </div>
        </div>

        {(record.tag || record.note) && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                补充信息
              </h2>
            </div>
            <div className="divide-y divide-slate-700/50">
              {record.tag && (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Tag className="w-4 h-4" />
                    <span>出行标签</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    {TAG_LABELS[record.tag]}
                  </span>
                </div>
              )}
              {record.note && (
                <div className="p-4">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <FileText className="w-4 h-4" />
                    <span>备注</span>
                  </div>
                  <p className="text-slate-300 bg-slate-900/50 rounded-lg p-3 text-sm leading-relaxed">
                    {record.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {intersectionStats && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 mb-6 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                该路口历史数据参考
              </h2>
              {intersectionStats.count > 0 && (
                <p className="text-slate-500 text-sm mt-1">
                  基于 {intersectionStats.count} 次历史记录统计（不含本次）
                </p>
              )}
            </div>

            {intersectionStats.count > 0 ? (
              <div className="p-4 space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm">历史平均等待时长</span>
                    <span className={`text-2xl font-bold font-mono ${getDurationColor(intersectionStats.avgDuration)}`}>
                      {formatDurationWithHours(intersectionStats.avgDuration)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (record.duration / Math.max(record.duration, intersectionStats.avgDuration)) * 50 + (intersectionStats.avgDuration / Math.max(record.duration, intersectionStats.avgDuration)) * 50)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-slate-500">本次: {formatDurationWithHours(record.duration)}</span>
                    <span className="text-slate-500">平均: {formatDurationWithHours(intersectionStats.avgDuration)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <div className="text-slate-400 text-xs mb-1">最短等待</div>
                    <div className={`text-xl font-bold font-mono ${getDurationColor(intersectionStats.minDuration)}`}>
                      {formatDurationWithHours(intersectionStats.minDuration)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <div className="text-slate-400 text-xs mb-1">最长等待</div>
                    <div className={`text-xl font-bold font-mono ${getDurationColor(intersectionStats.maxDuration)}`}>
                      {formatDurationWithHours(intersectionStats.maxDuration)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <div className="text-slate-400 text-xs mb-1">记录次数</div>
                    <div className="text-xl font-bold text-white">
                      {intersectionStats.count}<span className="text-sm font-normal text-slate-400 ml-1">次</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <div className="text-slate-400 text-xs mb-1">超限次数</div>
                    <div className={`text-xl font-bold ${intersectionStats.overLimitCount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                      {intersectionStats.overLimitCount}<span className="text-sm font-normal text-slate-400 ml-1">次</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm">暂无该路口的其他历史记录</p>
                <p className="text-slate-600 text-xs mt-1">本次是该路口的第一条记录</p>
              </div>
            )}
          </div>
        )}

        {intersection?.reasonableWaitTime && intersection.reasonableWaitTime > 0 && (
          <div className="bg-slate-800/50 rounded-xl border border-blue-500/30 p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              路口合理等待时长
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">设定阈值</span>
              <span className="text-white font-medium">
                {formatDurationWithHours(intersection.reasonableWaitTime)}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {record.isOverLimit
                ? `本次等待超过合理时长 ${formatDurationWithHours(record.duration - intersection.reasonableWaitTime)}`
                : `本次等待比合理时长少 ${formatDurationWithHours(intersection.reasonableWaitTime - record.duration)}`}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            删除记录
          </button>
        </div>
      </div>
    </div>
  );
}
