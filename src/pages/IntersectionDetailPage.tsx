import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  BarChart3,
  Award,
  Settings,
  Calendar,
  FileText,
  Cpu,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { GRADE_LABELS, GRADE_COLORS } from '@/types';
import { formatDurationWithHours } from '@/utils/timeUtils';
import { calculateAllTimingScores } from '@/utils/timingScore';

export default function IntersectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { intersections, records, groups, deleteIntersection } = useDataStore();

  const intersection = useMemo(() => {
    return intersections.find((i) => i.id === id);
  }, [intersections, id]);

  const timingScores = useMemo(() => {
    return calculateAllTimingScores(intersections, records);
  }, [intersections, records]);

  const score = useMemo(() => {
    return intersection ? timingScores.get(intersection.id) : undefined;
  }, [intersection, timingScores]);

  const intersectionRecords = useMemo(() => {
    if (!intersection) return [];
    return records.filter((r) => r.intersectionId === intersection.id);
  }, [records, intersection]);

  const intersectionGroups = useMemo(() => {
    if (!intersection) return [];
    return groups.filter((g) => g.intersectionIds.includes(intersection.id));
  }, [groups, intersection]);

  const stats = useMemo(() => {
    if (intersectionRecords.length === 0) return null;
    const durations = intersectionRecords.map((r) => r.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const overLimitCount = intersectionRecords.filter((r) => r.isOverLimit).length;
    return {
      count: intersectionRecords.length,
      avgDuration: Math.round(total / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      overLimitCount,
      overLimitRate: Math.round((overLimitCount / intersectionRecords.length) * 100),
    };
  }, [intersectionRecords]);

  const handleDelete = () => {
    if (!intersection) return;
    const message = intersectionRecords.length > 0
      ? `该路口有 ${intersectionRecords.length} 条记录，确定要删除吗？`
      : '确定要删除这个路口吗？';
    if (confirm(message)) {
      deleteIntersection(intersection.id);
      navigate('/intersections');
    }
  };

  if (!intersection) {
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            type="button"
            onClick={() => navigate('/intersections')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回路口管理
          </button>
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-white font-medium mb-2">路口不存在</p>
            <p className="text-slate-500 text-sm">该路口可能已被删除</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate('/intersections')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(`/intersections/${intersection.id}/signal-timing`)}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              title="编辑信号灯配时"
            >
              <Cpu className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="删除路口"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-7 h-7 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white mb-1">{intersection.name}</h1>
              <p className="text-slate-400 text-sm mb-2">{intersection.area}</p>
              {intersection.note && (
                <p className="text-slate-500 text-sm">{intersection.note}</p>
              )}
              {intersectionGroups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {intersectionGroups.map((group) => (
                    <span
                      key={group.id}
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: group.color + '25', color: group.color }}
                    >
                      {group.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Calendar className="w-3.5 h-3.5" />
              记录总数
            </div>
            <div className="text-2xl font-bold text-white">
              {intersectionRecords.length}
              <span className="text-sm font-normal text-slate-400 ml-1">次</span>
            </div>
          </div>
          {stats && (
            <>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  平均等待
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatDurationWithHours(stats.avgDuration)}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  超限次数
                </div>
                <div className="text-2xl font-bold text-orange-400">
                  {stats.overLimitCount}
                  <span className="text-sm font-normal text-slate-400 ml-1">次</span>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  超限率
                </div>
                <div className="text-2xl font-bold text-orange-400">
                  {stats.overLimitRate}
                  <span className="text-sm font-normal text-slate-400 ml-1">%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {score && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  配时评分
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-bold"
                    style={{ color: GRADE_COLORS[score.grade] }}
                  >
                    {score.totalScore}分
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: GRADE_COLORS[score.grade] + '20',
                      color: GRADE_COLORS[score.grade],
                    }}
                  >
                    {GRADE_LABELS[score.grade]}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">平均时长</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{score.dimensions.avgDurationScore}</span>
                    <span className="text-xs text-slate-500">{score.details.avgDuration}s</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score.dimensions.avgDurationScore}%`, backgroundColor: '#3b82f6' }}
                    />
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">峰谷差异</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{score.dimensions.peakValleyScore}</span>
                    <span className="text-xs text-slate-500">峰{score.details.peakAvg}s</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score.dimensions.peakValleyScore}%`, backgroundColor: '#8b5cf6' }}
                    />
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">稳定性</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{score.dimensions.varianceScore}</span>
                    <span className="text-xs text-slate-500">方差{score.details.variance}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score.dimensions.varianceScore}%`, backgroundColor: '#10b981' }}
                    />
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">超限率</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{score.dimensions.overLimitScore}</span>
                    <span className="text-xs text-slate-500">{score.details.overLimitRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${score.dimensions.overLimitScore}%`, backgroundColor: '#f59e0b' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              信号灯配时
            </h2>
            <button
              type="button"
              onClick={() => navigate(`/intersections/${intersection.id}/signal-timing`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm font-medium"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {intersection.signalTiming ? '编辑' : '录入'}
            </button>
          </div>

          {intersection.signalTiming ? (
            <div className="p-4">
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/20 flex items-center justify-center mb-2">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {intersection.signalTiming.redDuration}
                  </div>
                  <div className="text-xs text-slate-500">红灯(秒)</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center mb-2">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {intersection.signalTiming.greenDuration}
                  </div>
                  <div className="text-xs text-slate-500">绿灯(秒)</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-yellow-500/20 flex items-center justify-center mb-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {intersection.signalTiming.yellowDuration}
                  </div>
                  <div className="text-xs text-slate-500">黄灯(秒)</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    {intersection.signalTiming.cycleDuration}
                  </div>
                  <div className="text-xs text-slate-500">周期(秒)</div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">配时周期</span>
                  <span className="text-white font-medium">
                    {intersection.signalTiming.redDuration}秒红灯 + {intersection.signalTiming.yellowDuration}秒黄灯 + {intersection.signalTiming.greenDuration}秒绿灯 = {intersection.signalTiming.cycleDuration}秒
                  </span>
                </div>
                <div className="mt-2 w-full h-2 bg-slate-700 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(intersection.signalTiming.redDuration / intersection.signalTiming.cycleDuration) * 100}%` }}
                  />
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${(intersection.signalTiming.yellowDuration / intersection.signalTiming.cycleDuration) * 100}%` }}
                  />
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(intersection.signalTiming.greenDuration / intersection.signalTiming.cycleDuration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>红 {Math.round((intersection.signalTiming.redDuration / intersection.signalTiming.cycleDuration) * 100)}%</span>
                  <span>黄 {Math.round((intersection.signalTiming.yellowDuration / intersection.signalTiming.cycleDuration) * 100)}%</span>
                  <span>绿 {Math.round((intersection.signalTiming.greenDuration / intersection.signalTiming.cycleDuration) * 100)}%</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                上次更新：{new Date(intersection.signalTiming.updatedAt).toLocaleString('zh-CN')}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <Settings className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">暂无信号灯配时信息</p>
              <p className="text-slate-500 text-sm mb-4">点击右上角按钮录入配时信息</p>
              <button
                type="button"
                onClick={() => navigate(`/intersections/${intersection.id}/signal-timing`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
              >
                <Edit2 className="w-4 h-4" />
                录入配时
              </button>
            </div>
          )}
        </div>

        {intersection.reasonableWaitTime !== undefined && intersection.reasonableWaitTime > 0 && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                等待设置
              </h2>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">合理等待时长</span>
                <span className="text-white font-medium">
                  {formatDurationWithHours(intersection.reasonableWaitTime)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                超过该时长将显示超限提醒并触发振动（移动端）
              </p>
            </div>
          </div>
        )}

        {stats && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                历史数据统计
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">最短等待</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatDurationWithHours(stats.minDuration)}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">最长等待</div>
                  <div className="text-xl font-bold text-red-400">
                    {formatDurationWithHours(stats.maxDuration)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {score && score.suggestions.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                优化建议
              </h2>
            </div>
            <div className="p-4 space-y-2">
              {score.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-300 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
