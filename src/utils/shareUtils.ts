export interface RankItem {
  rank: number;
  name: string;
  avgDuration: number;
  recordCount: number;
}

export interface ShareImageData {
  title: string;
  periodLabel: string;
  items: RankItem[];
  appName: string;
  generatedAt: string;
}

const RANK_COLORS = [
  { bg: '#fbbf24', text: '#78350f' },
  { bg: '#94a3b8', text: '#1e293b' },
  { bg: '#d97706', text: '#451a03' },
  { bg: '#334155', text: '#cbd5e1' },
  { bg: '#334155', text: '#cbd5e1' },
];

export async function generateShareImage(data: ShareImageData): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new Error('当前环境不支持 Canvas，请在浏览器中使用');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('浏览器不支持 Canvas 2D 上下文，无法生成分享图片');
  }

  const width = 750;
  const padding = 40;
  const headerHeight = 160;
  const itemHeight = 110;
  const footerHeight = 100;
  const minItems = Math.max(data.items.length, 1);
  const height = headerHeight + minItems * itemHeight + footerHeight + padding * 2;

  canvas.width = width;
  canvas.height = height;

  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#0f172a');
  bgGradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
  ctx.beginPath();
  ctx.arc(width - 100, 120, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
  ctx.beginPath();
  ctx.arc(80, height - 150, 150, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(data.title, padding, padding + 20);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillText(data.periodLabel, padding, padding + 78);

  const accentGradient = ctx.createLinearGradient(padding, 0, padding + 120, 0);
  accentGradient.addColorStop(0, '#f59e0b');
  accentGradient.addColorStop(1, '#ef4444');
  ctx.fillStyle = accentGradient;
  ctx.beginPath();
  ctx.roundRect(padding, padding + 120, 80, 6, 3);
  ctx.fill();

  let y = padding + headerHeight;

  if (data.items.length > 0) {
    data.items.forEach((item, index) => {
      const colors = RANK_COLORS[index] || RANK_COLORS[RANK_COLORS.length - 1];

      ctx.fillStyle = 'rgba(51, 65, 85, 0.6)';
      ctx.beginPath();
      ctx.roundRect(padding, y, width - padding * 2, itemHeight - 16, 16);
      ctx.fill();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.arc(padding + 50, y + (itemHeight - 16) / 2, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.text;
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(item.rank), padding + 50, y + (itemHeight - 16) / 2 + 1);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'top';

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'top';

      const maxNameWidth = width - padding * 2 - 180;
      const displayName = truncateText(ctx, item.name, maxNameWidth);
      ctx.fillText(displayName, padding + 100, y + 24);

      ctx.fillStyle = '#64748b';
      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${item.recordCount} 次记录`, padding + 100, y + 60);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.avgDuration}s`, width - padding, y + 32);
      ctx.textAlign = 'start';

      ctx.fillStyle = '#64748b';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('平均等待', width - padding, y + 68);
      ctx.textAlign = 'start';

      y += itemHeight;
    });
  } else {
    const emptyY = padding + headerHeight + itemHeight * 0.5;
    ctx.fillStyle = '#475569';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无排行数据', width / 2, emptyY);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
  }

  const footerY = height - padding - footerHeight;

  ctx.fillStyle = '#475569';
  ctx.fillRect(padding, footerY, width - padding * 2, 1);

  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText(data.appName, padding, footerY + 30);

  ctx.textAlign = 'right';
  ctx.fillText(data.generatedAt, width - padding, footerY + 30);
  ctx.textAlign = 'start';

  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const watermarkText = data.appName;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 12);
  ctx.fillText(watermarkText, 0, 0);
  ctx.restore();
  ctx.textAlign = 'start';
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image blob'));
        }
      },
      'image/png',
      0.95
    );
  });
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let result = text;
  while (result.length > 1 && ctx.measureText(result + '…').width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + '…';
}

export async function shareImage(blob: Blob, title: string, text: string): Promise<boolean> {
  const file = new File([blob], 'traffic-ranking.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
