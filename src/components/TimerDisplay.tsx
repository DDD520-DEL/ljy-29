import { formatDuration } from '@/utils/timeUtils';
import { TimerStatus } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface TimerDisplayProps {
  seconds: number;
  status: TimerStatus;
  isOverLimit?: boolean;
}

export function TimerDisplay({ seconds, status, isOverLimit = false }: TimerDisplayProps) {
  const statusColors = {
    idle: 'text-slate-400',
    running: isOverLimit ? 'text-red-600' : 'text-red-500',
    stopped: 'text-green-500',
  };

  const statusGlow = {
    idle: '',
    running: isOverLimit
      ? 'drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] animate-pulse'
      : 'drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    stopped: 'drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]',
  };

  return (
    <div className="flex flex-col items-center">
      {isOverLimit && status === 'running' && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-400 font-bold text-sm">已超过合理等待时长！</span>
        </div>
      )}
      <div
        className={`font-mono text-8xl md:text-9xl font-bold tracking-wider ${statusColors[status]} ${statusGlow[status]} transition-all duration-300`}
      >
        {formatDuration(seconds)}
      </div>
      <div className="mt-4 text-slate-400 text-sm tracking-widest uppercase">
        {status === 'idle' && '等待开始'}
        {status === 'running' && !isOverLimit && '计时中...'}
        {status === 'running' && isOverLimit && '超限警告！'}
        {status === 'stopped' && '计时结束'}
      </div>
    </div>
  );
}
