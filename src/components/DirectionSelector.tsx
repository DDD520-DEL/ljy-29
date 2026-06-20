import { Direction, DIRECTION_LABELS } from '@/types';
import { useDataStore } from '@/store/useDataStore';

interface DirectionSelectorProps {
  disabled?: boolean;
}

export function DirectionSelector({ disabled = false }: DirectionSelectorProps) {
  const { selectedDirection, setSelectedDirection } = useDataStore();

  const directions: { value: Direction; label: string; position: string }[] = [
    { value: 'north', label: '北', position: 'col-start-2 row-start-1' },
    { value: 'west', label: '西', position: 'col-start-1 row-start-2' },
    { value: 'east', label: '东', position: 'col-start-3 row-start-2' },
    { value: 'south', label: '南', position: 'col-start-2 row-start-3' },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-slate-400 text-sm">选择方向</div>
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-48 h-48">
        {directions.map(({ value, label, position }) => (
          <button
            key={value}
            type="button"
            onClick={() => !disabled && setSelectedDirection(value)}
            disabled={disabled}
            className={`${position} w-14 h-14 rounded-xl font-bold text-lg transition-all duration-200 ${
              selectedDirection === value
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:scale-105'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {label}
          </button>
        ))}
        <div className="col-start-2 row-start-2 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-600/50 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-slate-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
