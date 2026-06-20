import { formatDuration } from '@/utils/timeUtils';
import { TimerStatus } from '@/types';

interface TimerDisplayProps {
  seconds: number;
  status: TimerStatus;
}

export function TimerDisplay({ seconds, status }: TimerDisplayProps) {
  const statusColors = {
    idle: 'text-slate-400',
    running: 'text-red-500',
    stopped: 'text-green-500',
  };

  const statusGlow = {
    idle: '',
    running: 'drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    stopped: 'drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]',
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`font-mono text-8xl md:text-9xl font-bold tracking-wider ${statusColors[status]} ${statusGlow[status]} transition-all duration-300`}
      >
        {formatDuration(seconds)}
      </div>
      <div className="mt-4 text-slate-400 text-sm tracking-widest uppercase">
        {status === 'idle' && '等待开始'}
        {status === 'running' && '计时中...'}
        {status === 'stopped' && '计时结束'}
      </div>
    </div>
  );
}
