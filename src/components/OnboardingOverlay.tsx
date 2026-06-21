import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Timer, ListTodo, BarChart3, Sparkles } from 'lucide-react';
import type { OnboardingStep } from '@/store/useOnboardingStore';

interface OnboardingOverlayProps {
  currentStep: OnboardingStep;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const stepConfig: Record<OnboardingStep, {
  title: string;
  description: string;
  icon: typeof Timer;
  iconColor: string;
  highlightPosition?: 'timer-button' | 'records-nav' | 'analysis-nav';
}> = {
  timer: {
    title: '开始你的第一次计时',
    description: '选择路口和方向后，点击红色的"开始计时"按钮，记录等待红绿灯的时间。停止后可保存记录。',
    icon: Timer,
    iconColor: 'text-red-400',
    highlightPosition: 'timer-button',
  },
  records: {
    title: '查看历史记录',
    description: '点击底部导航栏的"记录"按钮，可以查看所有历史等待记录，支持搜索、筛选和导出。',
    icon: ListTodo,
    iconColor: 'text-amber-400',
    highlightPosition: 'records-nav',
  },
  analysis: {
    title: '数据分析与洞察',
    description: '在"分析"页面查看各路口等待时长排名、时段对比、配时评分等数据，发现最让人抓狂的路口。',
    icon: BarChart3,
    iconColor: 'text-blue-400',
    highlightPosition: 'analysis-nav',
  },
};

export function OnboardingOverlay({
  currentStep,
  currentStepIndex,
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = stepConfig[currentStep];
  const Icon = config.icon;

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {config.highlightPosition === 'timer-button' && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[420px] w-48 h-20 rounded-2xl border-2 border-amber-400/50 animate-pulse shadow-[0_0_30px_rgba(251,191,36,0.3)]" />
      )}

      {config.highlightPosition === 'records-nav' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-[85px] w-16 h-16 rounded-xl border-2 border-amber-400/50 animate-pulse shadow-[0_0_30px_rgba(251,191,36,0.3)]" />
      )}

      {config.highlightPosition === 'analysis-nav' && (
        <div className="absolute bottom-4 left-1/2 translate-x-[15px] w-16 h-16 rounded-xl border-2 border-amber-400/50 animate-pulse shadow-[0_0_30px_rgba(251,191,36,0.3)]" />
      )}

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div
          className={`bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl transition-all duration-300 ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <button
            type="button"
            onClick={onSkip}
            className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="跳过引导"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${config.iconColor} bg-slate-700/50`}>
              <Icon className="w-8 h-8" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">
                第 {currentStepIndex + 1} 步 / 共 {totalSteps} 步
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-3">{config.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {config.description}
            </p>

            <div className="flex items-center gap-2 mb-6">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStepIndex
                      ? 'bg-amber-400 w-6'
                      : index < currentStepIndex
                      ? 'bg-amber-400/50'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 w-full">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="flex-1 py-3 px-4 rounded-xl font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  上一步
                </button>
              )}

              {isLastStep ? (
                <button
                  type="button"
                  onClick={onComplete}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  开始使用
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNext}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {!isLastStep && (
              <button
                type="button"
                onClick={onSkip}
                className="mt-4 text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                跳过引导
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
