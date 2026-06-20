import { Play, Square, RotateCcw, AlertCircle } from 'lucide-react';
import { TrafficLight } from '@/components/TrafficLight';
import { TimerDisplay } from '@/components/TimerDisplay';
import { IntersectionSelector } from '@/components/IntersectionSelector';
import { DirectionSelector } from '@/components/DirectionSelector';
import { useDataStore } from '@/store/useDataStore';

export default function TimerPage() {
  const { timerStatus, elapsedSeconds, selectedIntersectionId, selectedDirection, startTimer, stopTimer, resetTimer } = useDataStore();

  const canStart = selectedIntersectionId && selectedDirection && timerStatus !== 'running';
  const isDisabled = timerStatus === 'running';

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
          <TimerDisplay seconds={elapsedSeconds} status={timerStatus} />
        </div>

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

          {timerStatus === 'stopped' && (
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
            <IntersectionSelector disabled={isDisabled} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">选择方向</label>
            <div className="flex justify-center">
              <DirectionSelector disabled={isDisabled} />
            </div>
          </div>
        </div>

        {timerStatus === 'stopped' && (
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="text-green-400 font-medium mb-1">记录已保存！</div>
            <div className="text-sm text-slate-400">
              本次等待 {Math.round(elapsedSeconds)} 秒，可在"记录"页面查看详情
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
