import { useState, useCallback } from 'react';
import { Trophy, Share2, Copy, Download, Check, Loader2, X, AlertCircle, ImageOff } from 'lucide-react';
import {
  generateShareImage,
  shareImage,
  copyImageToClipboard,
  downloadImage,
  type RankItem,
} from '@/utils/shareUtils';

interface IntersectionRankingShareProps {
  weekItems: RankItem[];
  monthItems: RankItem[];
}

type ShareActionType = 'share' | 'copy' | 'download';
type GenerateStatus = 'idle' | 'generating' | 'error';
type ActionStatus = 'idle' | 'success' | 'error';

const RANK_BADGE_CLASSES = [
  'bg-yellow-500 text-yellow-900',
  'bg-slate-400 text-slate-800',
  'bg-amber-700 text-amber-100',
  'bg-slate-700 text-slate-400',
  'bg-slate-700 text-slate-400',
];

const APP_NAME = '路口等待记录';

export default function IntersectionRankingShare({
  weekItems,
  monthItems,
}: IntersectionRankingShareProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [showShareModal, setShowShareModal] = useState(false);

  const [generateStatus, setGenerateStatus] = useState<GenerateStatus>('idle');
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [activeAction, setActiveAction] = useState<ShareActionType | null>(null);
  const [actionStatuses, setActionStatuses] = useState<Record<ShareActionType, ActionStatus>>({
    share: 'idle',
    copy: 'idle',
    download: 'idle',
  });
  const [actionErrors, setActionErrors] = useState<Record<ShareActionType, string | null>>({
    share: null,
    copy: null,
    download: null,
  });

  const currentItems = period === 'week' ? weekItems : monthItems;
  const periodLabel = period === 'week' ? '本周排行' : '本月排行';
  const fullPeriodLabel = period === 'week' ? '近7天' : '近30天';
  const hasData = currentItems.length > 0;

  const formatDate = () => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  };

  const resetAllStatuses = useCallback(() => {
    setGenerateStatus('idle');
    setGenerateError(null);
    setActiveAction(null);
    setActionStatuses({ share: 'idle', copy: 'idle', download: 'idle' });
    setActionErrors({ share: null, copy: null, download: null });
  }, []);

  const handleOpenModal = () => {
    resetAllStatuses();
    setShowShareModal(true);
  };

  const handleCloseModal = () => {
    if (generateStatus === 'generating') return;
    setShowShareModal(false);
  };

  const runShareAction = async (actionType: ShareActionType) => {
    if (generateStatus === 'generating' || activeAction !== null) return;

    setActiveAction(actionType);
    setGenerateStatus('generating');
    setGenerateError(null);
    setActionStatuses(prev => ({ ...prev, [actionType]: 'idle' }));
    setActionErrors(prev => ({ ...prev, [actionType]: null }));

    let blob: Blob | null = null;
    try {
      blob = await generateShareImage({
        title: '最耗路口 Top 5',
        periodLabel: fullPeriodLabel,
        items: currentItems,
        appName: APP_NAME,
        generatedAt: formatDate(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setGenerateStatus('error');
      setGenerateError(errorMessage);
      setActiveAction(null);
      return;
    }

    setGenerateStatus('idle');

    let success = false;
    let errorMsg: string | null = null;

    try {
      switch (actionType) {
        case 'share':
          success = await shareImage(
            blob,
            '最耗路口 Top 5',
            `看看我在${APP_NAME}记录的${periodLabel}！`
          );
          if (!success) errorMsg = '当前浏览器不支持系统分享，试试复制或保存吧';
          break;
        case 'copy':
          success = await copyImageToClipboard(blob);
          if (!success) errorMsg = '当前浏览器不支持复制图片到剪贴板';
          break;
        case 'download':
          downloadImage(blob, `最耗路口Top5-${periodLabel}-${formatDate()}.png`);
          success = true;
          break;
      }
    } catch (error) {
      success = false;
      errorMsg = error instanceof Error ? error.message : '操作失败，请重试';
    }

    setActionStatuses(prev => ({
      ...prev,
      [actionType]: success ? 'success' : 'error',
    }));
    setActionErrors(prev => ({
      ...prev,
      [actionType]: errorMsg,
    }));
    setActiveAction(null);

    if (success && actionType === 'share') {
      setTimeout(() => {
        setShowShareModal(false);
      }, 1500);
    }
  };

  const renderButtonIcon = (actionType: ShareActionType, Icon: typeof Share2) => {
    const status = actionStatuses[actionType];
    const isGenerating = generateStatus === 'generating' && activeAction === actionType;
    const hasError = status === 'error' && !isGenerating;
    const isSuccess = status === 'success' && !isGenerating;

    if (isGenerating) {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    if (isSuccess) {
      return <Check className="w-5 h-5" />;
    }
    if (hasError) {
      return <X className="w-5 h-5" />;
    }
    return <Icon className="w-5 h-5" />;
  };

  const renderButtonText = (actionType: ShareActionType, defaultText: string) => {
    const status = actionStatuses[actionType];
    const error = actionErrors[actionType];
    const isGenerating = generateStatus === 'generating' && activeAction === actionType;
    const hasError = status === 'error' && !isGenerating;
    const isSuccess = status === 'success' && !isGenerating;

    if (isGenerating) {
      return '正在生成图片...';
    }
    if (isSuccess) {
      switch (actionType) {
        case 'share': return '分享成功';
        case 'copy': return '已复制到剪贴板';
        case 'download': return '图片已保存';
      }
    }
    if (hasError && error) {
      return error;
    }
    return defaultText;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          最耗路口 Top 5
        </h2>
        <button
          type="button"
          onClick={handleOpenModal}
          disabled={!hasData}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            hasData
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Share2 className="w-4 h-4" />
          分享
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="flex border-b border-slate-700/50">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                if (showShareModal) {
                  resetAllStatuses();
                }
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                period === p
                  ? 'text-amber-400 bg-slate-700/30 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {p === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>

        {hasData ? (
          <div className="divide-y divide-slate-700/50">
            {currentItems.map((item, index) => (
              <div
                key={item.rank}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    RANK_BADGE_CLASSES[index] || RANK_BADGE_CLASSES[RANK_BADGE_CLASSES.length - 1]
                  }`}
                >
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.recordCount} 次记录</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400">{item.avgDuration}s</div>
                  <div className="text-xs text-slate-500">平均等待</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <ImageOff className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">暂无数据，快去记录等待时间吧</p>
          </div>
        )}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-md bg-slate-800 rounded-t-2xl sm:rounded-2xl border border-slate-700 p-6 mx-4 mb-0 sm:mb-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">分享排行榜</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={generateStatus === 'generating'}
                className={`p-1 transition-colors ${
                  generateStatus === 'generating'
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-5">
              将「{periodLabel}」生成图片分享给好友
            </p>

            {generateStatus === 'error' && generateError && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-400">图片生成失败</p>
                  <p className="text-xs text-red-400/80 mt-0.5 break-all">{generateError}</p>
                </div>
              </div>
            )}

            {!hasData && (
              <div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-400">暂无排行数据</p>
                  <p className="text-xs text-amber-400/80 mt-0.5">请先记录一些等待时间后再分享</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => runShareAction('share')}
                disabled={generateStatus === 'generating' || activeAction !== null || !hasData}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-colors ${
                  actionStatuses.share === 'success'
                    ? 'bg-green-500 text-white'
                    : actionStatuses.share === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : generateStatus === 'generating' && activeAction === 'share'
                    ? 'bg-amber-500/70 text-white'
                    : hasData
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {renderButtonIcon('share', Share2)}
                <span className="truncate">{renderButtonText('share', '系统分享')}</span>
              </button>

              <button
                type="button"
                onClick={() => runShareAction('copy')}
                disabled={generateStatus === 'generating' || activeAction !== null || !hasData}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-colors ${
                  actionStatuses.copy === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : actionStatuses.copy === 'error'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : generateStatus === 'generating' && activeAction === 'copy'
                    ? 'bg-slate-600 text-white'
                    : hasData
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {renderButtonIcon('copy', Copy)}
                <span className="truncate">{renderButtonText('copy', '复制到剪贴板')}</span>
              </button>

              <button
                type="button"
                onClick={() => runShareAction('download')}
                disabled={generateStatus === 'generating' || activeAction !== null || !hasData}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-colors ${
                  actionStatuses.download === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : actionStatuses.download === 'error'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : generateStatus === 'generating' && activeAction === 'download'
                    ? 'bg-slate-600 text-white'
                    : hasData
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {renderButtonIcon('download', Download)}
                <span className="truncate">{renderButtonText('download', '保存图片')}</span>
              </button>
            </div>

            {generateStatus === 'generating' && (
              <p className="mt-4 text-xs text-center text-slate-500">
                正在为你生成精美的分享图片...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
