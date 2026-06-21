import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Filter, HardDrive, Trash2, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import type { SortOption } from '@/store/useDataStore';
import { TIME_PERIOD_LABELS } from '@/types';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: '最新优先' },
  { value: 'oldest', label: '最早优先' },
  { value: 'duration_desc', label: '时长久到短' },
  { value: 'duration_asc', label: '时长短到长' },
];

const STORAGE_KEYS = [
  'traffic_light_intersections',
  'traffic_light_records',
  'traffic_light_groups',
  'traffic_light_reminders',
  'traffic_light_checkins',
  'traffic_light_settings',
];

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData } = useDataStore();
  const { resetOnboarding } = useOnboardingStore();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleResetOnboarding = () => {
    resetOnboarding();
    navigate('/');
  };

  const storageInfo = (() => {
    let totalSize = 0;
    try {
      for (const key of STORAGE_KEYS) {
        const item = localStorage.getItem(key);
        if (item) {
          const size = new Blob([item]).size;
          totalSize += size;
        }
      }
    } catch (e) {
      // ignore
    }
    return { totalSize };
  })();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleClearAllData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">设置</h1>
          <p className="text-slate-400 text-sm">自定义你的使用偏好</p>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                计时器设置
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              <div className="px-4 py-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">自动重置计时器</div>
                  <div className="text-slate-400 text-sm mt-0.5">保存记录后自动重置计时器状态</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ autoResetTimer: !settings.autoResetTimer })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings.autoResetTimer ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.autoResetTimer ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-400" />
                默认筛选偏好
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              <div className="px-4 py-4">
                <div className="text-white font-medium mb-3">默认时段</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ defaultTimePeriod: 'all' })}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      settings.defaultTimePeriod === 'all'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    全部时段
                  </button>
                  {Object.entries(TIME_PERIOD_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateSettings({ defaultTimePeriod: key })}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        settings.defaultTimePeriod === key
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="text-white font-medium mb-3">默认排序方式</div>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateSettings({ defaultSort: option.value })}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        settings.defaultSort === option.value
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-400" />
                数据存储
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">存储位置</span>
                  <span className="text-slate-400 text-sm">浏览器本地存储 (localStorage)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">已用空间</span>
                  <span className="text-amber-400 font-medium">{formatSize(storageInfo.totalSize)}</span>
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-800/30">
                <p className="text-slate-500 text-xs">
                  数据仅保存在你的设备上，不会上传到任何服务器。清除浏览器数据会导致数据丢失。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                使用帮助
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              <button
                type="button"
                onClick={handleResetOnboarding}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors"
              >
                <div>
                  <div className="text-white font-medium">重新查看新手引导</div>
                  <div className="text-slate-400 text-sm mt-0.5">重新体验首次使用引导流程</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-red-500/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-red-500/30">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                危险操作
              </h2>
            </div>
            <div className="divide-y divide-red-500/20">
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-red-500/10 transition-colors"
              >
                <div>
                  <div className="text-red-400 font-medium">清除所有数据</div>
                  <div className="text-slate-400 text-sm mt-0.5">删除所有记录、路口、分组和提醒</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">清除所有数据</h3>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 text-sm mb-3">
                此操作将永久删除以下数据：
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  所有等待记录
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  所有路口信息
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  所有路口分组
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  所有定时提醒
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  打卡记录和设置偏好
                </li>
              </ul>
              <p className="text-red-400 text-sm mt-4 font-medium">
                ⚠️ 此操作不可恢复，请谨慎操作！
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleClearAllData}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
