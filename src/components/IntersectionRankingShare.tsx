import { useState } from 'react';
import { Trophy, Share2, Copy, Download, Check, Loader2, X } from 'lucide-react';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStatus, setShareStatus] = useState<{
    type: 'share' | 'copy' | 'download' | null;
    success: boolean;
  }>({ type: null, success: false });

  const currentItems = period === 'week' ? weekItems : monthItems;
  const periodLabel = period === 'week' ? '本周排行' : '本月排行';
  const fullPeriodLabel = period === 'week' ? '近7天' : '近30天';

  const formatDate = () => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setShareStatus({ type: null, success: false });

    try {
      const blob = await generateShareImage({
        title: '最耗路口 Top 5',
        periodLabel: fullPeriodLabel,
        items: currentItems.length > 0 ? currentItems : [],
        appName: APP_NAME,
        generatedAt: formatDate(),
      });

      return blob;
    } catch (error) {
      console.error('Failed to generate image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const blob = await handleGenerateImage();
    if (!blob) return;

    const shared = await shareImage(
      blob,
      '最耗路口 Top 5',
      `看看我在${APP_NAME}记录的${periodLabel}！`
    );
    setShareStatus({ type: 'share', success: shared });

    if (shared) {
      setTimeout(() => setShowShareModal(false), 1500);
    }
  };

  const handleCopy = async () => {
    const blob = await handleGenerateImage();
    if (!blob) return;

    const success = await copyImageToClipboard(blob);
    setShareStatus({ type: 'copy', success });
  };

  const handleDownload = async () => {
    const blob = await handleGenerateImage();
    if (!blob) return;

    downloadImage(blob, `最耗路口Top5-${periodLabel}-${formatDate()}.png`);
    setShareStatus({ type: 'download', success: true });
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
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
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
              onClick={() => setPeriod(p)}
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

        {currentItems.length > 0 ? (
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
          <div className="py-12 text-center text-slate-500 text-sm">
            暂无数据，快去记录等待时间吧
          </div>
        )}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowShareModal(false);
              setShareStatus({ type: null, success: false });
            }}
          />
          <div className="relative w-full max-w-md bg-slate-800 rounded-t-2xl sm:rounded-2xl border border-slate-700 p-6 mx-4 mb-0 sm:mb-auto animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">分享排行榜</h3>
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setShareStatus({ type: null, success: false });
                }}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              将「{periodLabel}」生成图片分享给好友
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleShare}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-medium rounded-xl transition-colors"
              >
                {isGenerating && shareStatus.type === null ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : shareStatus.type === 'share' && shareStatus.success ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
                {shareStatus.type === 'share'
                  ? shareStatus.success
                    ? '分享成功'
                    : '原生分享不可用，请尝试其他方式'
                  : '系统分享'}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-medium rounded-xl transition-colors"
              >
                {isGenerating && shareStatus.type === null ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : shareStatus.type === 'copy' ? (
                  shareStatus.success ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <X className="w-5 h-5 text-red-400" />
                  )
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                {shareStatus.type === 'copy'
                  ? shareStatus.success
                    ? '已复制到剪贴板'
                    : '复制失败，请保存图片'
                  : '复制到剪贴板'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-medium rounded-xl transition-colors"
              >
                {isGenerating && shareStatus.type === null ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : shareStatus.type === 'download' && shareStatus.success ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {shareStatus.type === 'download' && shareStatus.success
                  ? '图片已保存'
                  : '保存图片'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
