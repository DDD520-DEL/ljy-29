import { useState } from 'react';
import { Bell, Plus, Trash2, Clock, Vibrate, AlertTriangle, Settings, X } from 'lucide-react';
import { DailyReminder } from '@/types';
import { useNotification } from '@/hooks/useNotification';
import { useDataStore } from '@/store/useDataStore';

export function ReminderSettings() {
  const { reminders, addReminder, updateReminder, deleteReminder } = useDataStore();
  const { requestPermission, checkPermission, triggerReminder } = useNotification(reminders);
  const [hasPermission, setHasPermission] = useState(checkPermission());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHour, setNewHour] = useState(8);
  const [newMinute, setNewMinute] = useState(0);
  const [newLabel, setNewLabel] = useState('');
  const [newVibrate, setNewVibrate] = useState(true);

  const handleRequestPermission = async () => {
    const permission = await requestPermission();
    setHasPermission(permission === 'granted');
  };

  const handleAddReminder = () => {
    if (!newLabel.trim()) return;
    addReminder({
      enabled: true,
      hour: newHour,
      minute: newMinute,
      label: newLabel.trim(),
      vibrate: newVibrate,
    });
    setShowAddForm(false);
    setNewLabel('');
    setNewHour(8);
    setNewMinute(0);
    setNewVibrate(true);
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const testReminder = (reminder: DailyReminder) => {
    triggerReminder(reminder);
  };

  return (
    <div className="space-y-4">
      {!hasPermission && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-amber-400 font-medium mb-1">通知权限未开启</div>
              <div className="text-sm text-slate-400 mb-3">开启后可以在设定时间通过浏览器通知提醒你</div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                开启通知权限
              </button>
            </div>
          </div>
        </div>
      )}

      {hasPermission && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-green-400 font-medium">通知已开启</div>
              <div className="text-sm text-slate-400">到设定时间会通过浏览器通知提醒你</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-white">定时提醒</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showAddForm
                ? 'bg-slate-700 text-slate-300'
                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
            }`}
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4" />
                取消
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                添加
              </>
            )}
          </button>
        </div>

        {showAddForm && (
          <div className="p-4 border-b border-slate-700/50 bg-slate-900/30 space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">提醒时间</label>
              <div className="flex items-center gap-2">
                <select
                  value={newHour}
                  onChange={(e) => setNewHour(parseInt(e.target.value))}
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-white text-lg font-medium">:</span>
                <select
                  value={newMinute}
                  onChange={(e) => setNewMinute(parseInt(e.target.value))}
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">提醒内容</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="例如：早高峰出发前提醒"
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-amber-500 placeholder-slate-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">震动提醒（移动端）</span>
              </div>
              <button
                type="button"
                onClick={() => setNewVibrate(!newVibrate)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  newVibrate ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-out"
                  style={{ transform: newVibrate ? 'translateX(22px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddReminder}
              disabled={!newLabel.trim()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              保存提醒
            </button>
          </div>
        )}

        <div className="divide-y divide-slate-700/50">
          {reminders.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <div className="text-slate-500 text-sm">暂无提醒，点击上方添加按钮创建</div>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-4 flex items-center gap-4 hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">
                      {formatTime(reminder.hour, reminder.minute)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateReminder(reminder.id, { enabled: !reminder.enabled })}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        reminder.enabled ? 'bg-green-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-out"
                        style={{ transform: reminder.enabled ? 'translateX(22px)' : 'translateX(0)' }}
                      />
                    </button>
                  </div>
                  <div className="text-sm text-slate-400 mt-1 truncate">{reminder.label}</div>
                  {reminder.vibrate && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Vibrate className="w-3 h-3" />
                      <span>震动提醒已开启</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => testReminder(reminder)}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                    title="测试提醒"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="删除提醒"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
