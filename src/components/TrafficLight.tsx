import { TimerStatus } from '@/types';

interface TrafficLightProps {
  status: TimerStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function TrafficLight({ status, size = 'md' }: TrafficLightProps) {
  const sizeClasses = {
    sm: 'w-16 h-44',
    md: 'w-24 h-64',
    lg: 'w-32 h-80',
  };

  const lightSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const isRed = status === 'idle' || status === 'running';
  const isGreen = status === 'stopped';

  return (
    <div className={`${sizeClasses[size]} bg-slate-800 rounded-2xl flex flex-col items-center justify-around py-4 shadow-2xl border-4 border-slate-700`}>
      <div
        className={`${lightSizeClasses[size]} rounded-full transition-all duration-500 ${
          isRed
            ? 'bg-red-500 shadow-[0_0_30px_10px_rgba(239,68,68,0.6)]'
            : 'bg-red-900/50'
        }`}
      />
      <div
        className={`${lightSizeClasses[size]} rounded-full transition-all duration-500 bg-yellow-900/50`}
      />
      <div
        className={`${lightSizeClasses[size]} rounded-full transition-all duration-500 ${
          isGreen
            ? 'bg-green-500 shadow-[0_0_30px_10px_rgba(34,197,94,0.6)]'
            : 'bg-green-900/50'
        }`}
      />
    </div>
  );
}
