import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';

export default function SignalTimingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { intersections, updateSignalTiming } = useDataStore();

  const intersection = useMemo(() => {
    return intersections.find((i) => i.id === id);
  }, [intersections, id]);

  const [formData, setFormData] = useState({
    redDuration: '',
    greenDuration: '',
    yellowDuration: '',
    cycleDuration: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (intersection?.signalTiming) {
      setFormData({
        redDuration: intersection.signalTiming.redDuration.toString(),
        greenDuration: intersection.signalTiming.greenDuration.toString(),
        yellowDuration: intersection.signalTiming.yellowDuration.toString(),
        cycleDuration: intersection.signalTiming.cycleDuration.toString(),
      });
    }
  }, [intersection]);

  const calculateCycle = () => {
    const red = parseInt(formData.redDuration, 10) || 0;
    const green = parseInt(formData.greenDuration, 10) || 0;
    const yellow = parseInt(formData.yellowDuration, 10) || 0;
    if (red > 0 || green > 0 || yellow > 0) {
      setFormData((prev) => ({
        ...prev,
        cycleDuration: (red + green + yellow).toString(),
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const red = parseInt(formData.redDuration, 10);
    const green = parseInt(formData.greenDuration, 10);
    const yellow = parseInt(formData.yellowDuration, 10);
    const cycle = parseInt(formData.cycleDuration, 10);

    if (!formData.redDuration.trim() || isNaN(red) || red <= 0) {
      newErrors.redDuration = '请输入有效的红灯时长';
    }
    if (!formData.greenDuration.trim() || isNaN(green) || green <= 0) {
      newErrors.greenDuration = '请输入有效的绿灯时长';
    }
    if (!formData.yellowDuration.trim() || isNaN(yellow) || yellow <= 0) {
      newErrors.yellowDuration = '请输入有效的黄灯时长';
    }
    if (!formData.cycleDuration.trim() || isNaN(cycle) || cycle <= 0) {
      newErrors.cycleDuration = '请输入有效的周期总时长';
    }

    if (red > 0 && green > 0 && yellow > 0 && cycle > 0) {
      const calculatedCycle = red + green + yellow;
      if (cycle !== calculatedCycle) {
        newErrors.cycleDuration = `周期时长应等于红+黄+绿 (${calculatedCycle}秒)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !intersection) return;

    updateSignalTiming(intersection.id, {
      redDuration: parseInt(formData.redDuration, 10),
      greenDuration: parseInt(formData.greenDuration, 10),
      yellowDuration: parseInt(formData.yellowDuration, 10),
      cycleDuration: parseInt(formData.cycleDuration, 10),
    });

    navigate(`/intersections/${intersection.id}`);
  };

  const handleCancel = () => {
    if (intersection) {
      navigate(`/intersections/${intersection.id}`);
    } else {
      navigate('/intersections');
    }
  };

  if (!intersection) {
    return (
      <div className="min-h-screen pb-24">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            type="button"
            onClick={() => navigate('/intersections')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回路口管理
          </button>
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-white font-medium mb-2">路口不存在</p>
            <p className="text-slate-500 text-sm">该路口可能已被删除</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回路口详情
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">信号灯配时</h1>
              <p className="text-slate-400 text-sm">{intersection.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-white font-medium">{intersection.name}</div>
              <div className="text-sm text-slate-400">{intersection.area}</div>
              {intersection.note && (
                <div className="text-xs text-slate-500 mt-1">{intersection.note}</div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
              <span className="text-white font-medium">红灯时长</span>
            </div>
            <div>
              <input
                type="number"
                min="1"
                value={formData.redDuration}
                onChange={(e) => {
                  setFormData({ ...formData, redDuration: e.target.value });
                }}
                onBlur={calculateCycle}
                placeholder="输入红灯时长（秒）"
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 ${
                  errors.redDuration ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.redDuration ? (
                  <span className="text-xs text-red-400">{errors.redDuration}</span>
                ) : (
                  <span className="text-xs text-slate-500">例如：30秒</span>
                )}
                <span className="text-xs text-slate-500">单位：秒</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-white font-medium">绿灯时长</span>
            </div>
            <div>
              <input
                type="number"
                min="1"
                value={formData.greenDuration}
                onChange={(e) => {
                  setFormData({ ...formData, greenDuration: e.target.value });
                }}
                onBlur={calculateCycle}
                placeholder="输入绿灯时长（秒）"
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 ${
                  errors.greenDuration ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.greenDuration ? (
                  <span className="text-xs text-red-400">{errors.greenDuration}</span>
                ) : (
                  <span className="text-xs text-slate-500">例如：25秒</span>
                )}
                <span className="text-xs text-slate-500">单位：秒</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
              </div>
              <span className="text-white font-medium">黄灯时长</span>
            </div>
            <div>
              <input
                type="number"
                min="1"
                value={formData.yellowDuration}
                onChange={(e) => {
                  setFormData({ ...formData, yellowDuration: e.target.value });
                }}
                onBlur={calculateCycle}
                placeholder="输入黄灯时长（秒）"
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 ${
                  errors.yellowDuration ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.yellowDuration ? (
                  <span className="text-xs text-red-400">{errors.yellowDuration}</span>
                ) : (
                  <span className="text-xs text-slate-500">通常为3-5秒</span>
                )}
                <span className="text-xs text-slate-500">单位：秒</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="text-white font-medium">周期总时长</span>
            </div>
            <div>
              <input
                type="number"
                min="1"
                value={formData.cycleDuration}
                onChange={(e) => {
                  setFormData({ ...formData, cycleDuration: e.target.value });
                }}
                placeholder="红灯 + 绿灯 + 黄灯 总时长"
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 ${
                  errors.cycleDuration ? 'border-red-500' : 'border-slate-600'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.cycleDuration ? (
                  <span className="text-xs text-red-400">{errors.cycleDuration}</span>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    自动计算：红+绿+黄
                  </div>
                )}
                <span className="text-xs text-slate-500">单位：秒</span>
              </div>
            </div>
          </div>

          {intersection.signalTiming && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
              <div className="text-sm text-slate-400">
                <span>上次更新：</span>
                <span className="text-slate-300">
                  {new Date(intersection.signalTiming.updatedAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存配时
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
