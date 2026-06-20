import { useState, useMemo } from 'react';
import { Play, Square, RotateCcw, AlertCircle, CheckCircle, Clock, Tag, FileText, Save, X, Sparkles } from 'lucide-react';
import { TrafficLight } from '@/components/TrafficLight';
import { TimerDisplay } from '@/components/TimerDisplay';
import { IntersectionSelector } from '@/components/IntersectionSelector';
import { DirectionSelector } from '@/components/DirectionSelector';
import { useDataStore } from '@/store/useDataStore';
import { TAG_OPTIONS, Tag as TagType } from '@/types';
import { calculateMovingAveragePredictions, getCurrentPeriodPrediction } from '@/utils/predictionUtils';

export default function TimerPage() {
  const { timerStatus, elapsedSeconds, isOverLimit, selectedIntersectionId, selectedDirection, lastSaveResult, pendingRecord, intersections, records, startTimer, stopTimer, resetTimer, confirmSaveRecord } = useDataStore();

  const currentIntersection = intersections.find(i => i.id === selectedIntersectionId);
  const reasonableWaitTime = currentIntersection?.reasonableWaitTime;

  const currentPrediction = useMemo(() => {
    if (!selectedIntersectionId || !currentIntersection) return null;
    const prediction = calculateMovingAveragePredictions(
      records,
      selectedIntersectionId,
      currentIntersection.name,
      14
    );
    return getCurrentPeriodPrediction(prediction);
  }, [selectedIntersectionId, currentIntersection, records]);

  const [note, setNote] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagType | undefined>(undefined);

  const canStart = selectedIntersectionId && selectedDirection && timerStatus !== 'running';
  const isDisabled = timerStatus === 'running';
  const showSaveDialog = timerStatus === 'stopped' && pendingRecord !== null;

  const handleSave = () => {
    confirmSaveRecord(note, selectedTag);
    setNote('');
    setSelectedTag(undefined);
  };

  const handleDiscard = () => {
    resetTimer();
    setNote('');
    setSelectedTag(undefined);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">红绿灯等待计时</h1>
          <p className="text-slate-400 text-sm">记录每一次等待，让城市更高效</p>
        </div>

        <div className="flex justify-center mb-8">
          <TrafficLight status={timerStatus} size="md" />
        </div>

        <div className="mb-8">
          <TimerDisplay seconds={elapsedSeconds} status={timerStatus} isOverLimit={isOverLimit} />
        </div>

        {timerStatus === 'running' && reasonableWaitTime !== undefined && reasonableWaitTime > 0 && (
          <div className="mb-6 text-center">
            <span className="text-sm text-slate-400">
              合理等待时长：<span className="text-amber-400 font-medium">{reasonableWaitTime}秒</span>
              {isOverLimit && (
                <span className="ml-2 text-red-400 font-bold">
                  (已超出 {elapsedSeconds - reasonableWaitTime} 秒)
                </span>
              )}
            </span>
          </div>
        )}

        {selectedIntersectionId && currentPrediction && timerStatus === 'idle' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">当前时段预测</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-300">{currentPrediction.periodLabel}</div>
                <div className="text-xs text-slate-500">基于近14天历史数据</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">
                  {currentPrediction.predictedDuration}
                  <span className="text-sm font-normal text-slate-400 ml-1">秒</span>
                </div>
                <div className="text-xs text-slate-500">预估等待时长</div>
              </div>
            </div>
            {reasonableWaitTime !== undefined && reasonableWaitTime > 0 && (
              <div className="mt-2 pt-2 border-t border-purple-500/20">
                {currentPrediction.predictedDuration > reasonableWaitTime ? (
                  <span className="text-xs text-orange-400">
                    ⚠️ 预测值超过合理时长，建议错峰出行
                  </span>
                ) : (
                  <span className="text-xs text-green-400">
                    ✓ 预测值在合理范围内
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center gap-4 mb-8">
          {timerStatus === 'idle' && (
            <button
              type="button"
              onClick={startTimer}
              disabled={!canStart}
              className={`px-12 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all transform active:scale-95 ${
                canStart
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:shadow-red-500/40'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-6 h-6" />
              开始计时
            </button>
          )}

          {timerStatus === 'running' && (
            <button
              type="button"
              onClick={stopTimer}
              className="px-12 py-4 rounded-2xl font-bold text-lg bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-600 hover:shadow-green-500/40 transition-all transform active:scale-95 flex items-center gap-3"
            >
              <Square className="w-6 h-6" />
              停止
            </button>
          )}

          {timerStatus === 'stopped' && !showSaveDialog && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetTimer}
                className="px-6 py-4 rounded-2xl font-medium text-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                重置
              </button>
              <button
                type="button"
                onClick={startTimer}
                className="px-8 py-4 rounded-2xl font-bold text-lg bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all transform active:scale-95 flex items-center gap-3"
              >
                <Play className="w-6 h-6" />
                再来一次
              </button>
            </div>
          )}
        </div>

        {timerStatus === 'idle' && !selectedIntersectionId && (
          <div className="flex items-center gap-2 justify-center mb-6 text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            请先选择路口
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">选择路口</label>
            <IntersectionSelector disabled={isDisabled || showSaveDialog} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">选择方向</label>
            <div className="flex justify-center">
              <DirectionSelector disabled={isDisabled || showSaveDialog} />
            </div>
          </div>
        </div>

        {showSaveDialog && (
          <div className="mt-8 p-5 bg-slate-800/80 border border-amber-500/30 rounded-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-medium">
                <Save className="w-5 h-5" />
                保存等待记录
              </div>
              <div className="text-lg font-bold text-white">
                {pendingRecord.duration}秒
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                <Tag className="w-4 h-4" />
                选择标签
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === option.value ? undefined : option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedTag === option.value
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                <FileText className="w-4 h-4" />
                备注
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="添加备注（可选）..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 px-4 py-3 rounded-xl font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                放弃
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存记录
              </button>
            </div>
          </div>
        )}

        {timerStatus === 'stopped' && lastSaveResult === 'success' && (
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-green-400 font-medium mb-1">
              <CheckCircle className="w-5 h-5" />
              记录已保存！
            </div>
            <div className="text-sm text-slate-400">
              本次等待 {Math.round(elapsedSeconds)} 秒，可在"记录"页面查看详情
            </div>
          </div>
        )}

        {timerStatus === 'stopped' && lastSaveResult === 'too_short' && (
          <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 font-medium mb-1">
              <Clock className="w-5 h-5" />
              等待时间太短未记录
            </div>
            <div className="text-sm text-slate-400">
              至少等待 1 秒以上才会保存记录，请重新开始计时
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
