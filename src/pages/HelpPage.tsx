import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft, Send, CheckCircle, MessageCircle, Clock, HardDrive, Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface FeedbackItem {
  id: string;
  content: string;
  createdAt: number;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: typeof Clock;
  iconColor: string;
}

const faqList: FAQItem[] = [
  {
    id: 'timer-usage',
    question: '如何使用计时器',
    answer: '1. 在"计时"页面，先从顶部选择要计时的路口；\n2. 选择你当前行进的方向（直行、左转、右转、调头）；\n3. 点击红色的"开始计时"按钮，计时器会自动开始；\n4. 当绿灯亮起你通过路口后，点击"停止计时"按钮；\n5. 在弹出的对话框中，可添加备注和心情标签，然后点击"保存记录"即可保存本次等待数据。\n\n小提示：如果该路口设置了合理等待时长，当超过该时长时会自动提醒并触发振动。',
    icon: Clock,
    iconColor: 'text-red-400',
  },
  {
    id: 'data-loss',
    question: '数据会丢失吗',
    answer: '所有数据均保存在你的浏览器本地存储（localStorage）中，不会上传到任何服务器，因此：\n\n✅ 正常使用情况下，数据不会丢失；\n✅ 关闭浏览器、重启电脑都不会影响数据；\n⚠️ 清除浏览器缓存或浏览器数据会导致数据全部清除；\n⚠️ 更换设备或浏览器时，数据不会自动同步；\n💡 建议定期将重要数据手动记录或截图保存。\n\n你可以在"设置 - 数据存储"中查看当前已使用的存储空间。',
    icon: HardDrive,
    iconColor: 'text-blue-400',
  },
  {
    id: 'add-intersection',
    question: '如何添加新路口',
    answer: '1. 点击底部导航栏的"路口"按钮进入路口管理页面；\n2. 点击右上角的"添加路口"按钮；\n3. 填写路口信息：\n   · 路口名称（必填）：如"人民大道与中山街交叉口"\n   · 所属区域（必填）：如"市中心"、"高新区"\n   · 合理等待时长（可选）：超过该秒数将触发提醒\n   · 备注（可选）：其他需要补充的信息\n4. 点击"保存"按钮即可完成添加。\n\n添加后的路口可以在计时页面的路口选择器中直接选择使用。你也可以创建自定义分组来管理多个路口。',
    icon: Plus,
    iconColor: 'text-emerald-400',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbacks, setFeedbacks] = useLocalStorage<FeedbackItem[]>('traffic_light_feedbacks', []);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitFeedback = () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) return;

    const newFeedback: FeedbackItem = {
      id: Date.now().toString(),
      content: trimmed,
      createdAt: Date.now(),
    };

    setFeedbacks([newFeedback, ...feedbacks]);
    setFeedbackText('');
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 2500);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">帮助与反馈</h1>
            <p className="text-slate-400 text-sm">常见问题解答与意见反馈</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                常见问题
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              {faqList.map((faq) => {
                const isExpanded = expandedId === faq.id;
                const Icon = faq.icon;
                return (
                  <div key={faq.id} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleExpand(faq.id)}
                      className="w-full px-4 py-4 flex items-start justify-between text-left hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0 ${faq.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-white font-medium pt-1.5">{faq.question}</span>
                      </div>
                      <div className="ml-3 flex-shrink-0 mt-1.5">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-96' : 'max-h-0'
                      }`}
                    >
                      <div className="px-4 pb-4 pl-16">
                        <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-line bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                意见反馈
              </h2>
            </div>
            <div className="p-4">
              <p className="text-slate-400 text-sm mb-4">
                遇到问题或有改进建议？欢迎留下你的反馈，我们会认真阅读每一条意见。
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    反馈内容
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="请描述你遇到的问题或建议..."
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {feedbackText.length} 字
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackText.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                  >
                    {showSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        提交成功
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        提交反馈
                      </>
                    )}
                  </button>
                </div>

                {showSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm animate-fade-in">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>感谢你的反馈！内容已保存到本地。</span>
                  </div>
                )}
              </div>

              {feedbacks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-300">我的反馈记录</h3>
                    <span className="text-xs text-slate-500">{feedbacks.length} 条</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50"
                      >
                        <div className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                          {feedback.content}
                        </div>
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(feedback.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
