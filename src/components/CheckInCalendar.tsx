import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Flame, Trophy, Star, Crown, Dumbbell } from 'lucide-react';
import { CheckInRecord, CHECKIN_REWARD_LABELS, CheckInReward } from '@/types';
import { formatDate } from '@/utils/timeUtils';

interface CheckInCalendarProps {
  checkInRecords: CheckInRecord[];
  streakDays: number;
  currentReward: CheckInReward;
  isTodayCheckedIn: boolean;
  totalCheckedInDays: number;
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const REWARD_ICONS: Record<CheckInReward, React.ComponentType<{ className?: string }>> = {
  none: Star,
  '3days': Star,
  '7days': Flame,
  '14days': Dumbbell,
  '30days': Crown,
};

const REWARD_COLORS: Record<CheckInReward, string> = {
  none: 'text-slate-500',
  '3days': 'text-yellow-400',
  '7days': 'text-orange-400',
  '14days': 'text-green-400',
  '30days': 'text-purple-400',
};

export function CheckInCalendar({
  checkInRecords,
  streakDays,
  currentReward,
  isTodayCheckedIn,
  totalCheckedInDays,
}: CheckInCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const checkInMap = new Map(checkInRecords.map(r => [r.date, r]));

    const days: { date: Date; dateStr: string; record?: CheckInRecord; isToday: boolean; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = formatDate(date.toISOString());
      days.push({
        date,
        dateStr,
        record: checkInMap.get(dateStr),
        isToday: false,
        isCurrentMonth: false,
      });
    }

    const todayStr = formatDate(new Date().toISOString());
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date.toISOString());
      days.push({
        date,
        dateStr,
        record: checkInMap.get(dateStr),
        isToday: dateStr === todayStr,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = formatDate(date.toISOString());
      days.push({
        date,
        dateStr,
        record: checkInMap.get(dateStr),
        isToday: false,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewDate, checkInRecords]);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const RewardIcon = REWARD_ICONS[currentReward];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
            <Flame className="w-4 h-4" />
            <span>连续打卡</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {streakDays}<span className="text-base font-normal text-slate-400 ml-1">天</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <Check className="w-4 h-4" />
            <span>累计打卡</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {totalCheckedInDays}<span className="text-base font-normal text-slate-400 ml-1">天</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
            <Trophy className="w-4 h-4" />
            <span>当前成就</span>
          </div>
          <div className={`text-lg font-bold flex items-center gap-1 ${REWARD_COLORS[currentReward]}`}>
            <RewardIcon className="w-5 h-5" />
            <span>{CHECKIN_REWARD_LABELS[currentReward]}</span>
          </div>
        </div>
      </div>

      {isTodayCheckedIn && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-white font-semibold">今日已打卡 🎉</div>
              <div className="text-sm text-slate-400">完成至少一次计时即可打卡</div>
            </div>
          </div>
        </div>
      )}

      {!isTodayCheckedIn && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
              <Star className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <div className="text-white font-semibold">今日还未打卡</div>
              <div className="text-sm text-slate-400">完成一次计时即可自动打卡</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-white">
              {viewDate.getFullYear()}年{viewDate.getMonth() + 1}月
            </span>
            <button
              type="button"
              onClick={goToToday}
              className="text-xs px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              今天
            </button>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-xs text-slate-500 font-medium py-2">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarData.map(({ date, dateStr, record, isToday, isCurrentMonth }) => {
            const checkedIn = record?.checkedIn;
            return (
              <div
                key={dateStr}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                  transition-all relative
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isToday ? 'ring-2 ring-amber-400' : ''}
                  ${checkedIn ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/30 text-slate-400'}
                  ${checkedIn && isToday ? 'bg-amber-500/20 text-amber-400' : ''}
                `}
                title={record ? `${dateStr}: ${record.recordCount}次记录, ${record.totalDuration}秒` : dateStr}
              >
                <span className="font-medium">{date.getDate()}</span>
                {checkedIn && (
                  <Check className="w-3 h-3 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/30" />
            <span>已打卡</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-700/30" />
            <span>未打卡</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-2 ring-amber-400 bg-slate-700/30" />
            <span>今天</span>
          </div>
        </div>
      </div>
    </div>
  );
}
