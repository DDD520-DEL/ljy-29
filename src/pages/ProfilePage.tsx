import { User, CalendarDays, Bell } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { CheckInCalendar } from '@/components/CheckInCalendar';
import { ReminderSettings } from '@/components/ReminderSettings';

export default function ProfilePage() {
  const { checkInRecords, getStreakDays, getCheckInReward, isTodayCheckedIn } = useDataStore();

  const streakDays = getStreakDays();
  const currentReward = getCheckInReward();
  const todayCheckedIn = isTodayCheckedIn();
  const totalCheckedInDays = checkInRecords.filter(r => r.checkedIn).length;

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">我的</h1>
          <p className="text-slate-400 text-sm">打卡记录与提醒设置</p>
        </div>

        <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <User className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">红绿灯记录达人</div>
              <div className="text-sm text-slate-400">已坚持记录 · 保持好习惯</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-400" />
            每日打卡
          </h2>
          <CheckInCalendar
            checkInRecords={checkInRecords}
            streakDays={streakDays}
            currentReward={currentReward}
            isTodayCheckedIn={todayCheckedIn}
            totalCheckedInDays={totalCheckedInDays}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            定时提醒
          </h2>
          <ReminderSettings />
        </div>
      </div>
    </div>
  );
}
