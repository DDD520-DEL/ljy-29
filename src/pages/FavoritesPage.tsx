import { useMemo } from 'react';
import { MapPin, Clock, Play, StarOff } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useNavigate } from 'react-router-dom';
import { GRADE_LABELS, GRADE_COLORS } from '@/types';
import { calculateAllTimingScores } from '@/utils/timingScore';
import { FavoriteStarButton } from '@/components/IntersectionSelector';

export default function FavoritesPage() {
  const { intersections, favoriteIds, records, setSelectedIntersection } = useDataStore();
  const navigate = useNavigate();

  const favoriteIntersections = useMemo(() => {
    return favoriteIds
      .map(id => intersections.find(i => i.id === id))
      .filter((i): i is NonNullable<typeof i> => i !== undefined);
  }, [favoriteIds, intersections]);

  const timingScores = useMemo(() => {
    return calculateAllTimingScores(intersections, records);
  }, [intersections, records]);

  const handleGoToTimer = (intersectionId: string) => {
    setSelectedIntersection(intersectionId);
    navigate('/');
  };

  const getRecordCount = (intersectionId: string) => {
    return records.filter(r => r.intersectionId === intersectionId).length;
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">收藏路口</h1>
          <p className="text-slate-400 text-sm">快速访问常用路口，长按星标添加或移除收藏</p>
        </div>

        {favoriteIntersections.length > 0 ? (
          <div className="space-y-3">
            {favoriteIntersections.map((intersection) => {
              const score = timingScores.get(intersection.id);
              const recordCount = getRecordCount(intersection.id);
              return (
                <div
                  key={intersection.id}
                  className="bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{intersection.name}</div>
                        <div className="text-sm text-slate-400">{intersection.area}</div>
                        {intersection.note && (
                          <div className="text-xs text-slate-500 mt-1">{intersection.note}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-slate-500">
                            {recordCount} 条记录
                          </span>
                          {intersection.reasonableWaitTime !== undefined && intersection.reasonableWaitTime > 0 && (
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              合理等待 {intersection.reasonableWaitTime} 秒
                            </span>
                          )}
                          {score && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: GRADE_COLORS[score.grade] }}
                            >
                              {GRADE_LABELS[score.grade]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleGoToTimer(intersection.id)}
                          className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="去计时"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <FavoriteStarButton intersectionId={intersection.id} isFav={true} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <StarOff className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 mb-1">暂无收藏路口</p>
            <p className="text-slate-500 text-sm mb-6">在路口选择器中点击星标即可添加收藏</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              去计时页面
            </button>
          </div>
        )}

        {favoriteIntersections.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-slate-400 mb-3">未收藏的路口</h2>
            <div className="space-y-2">
              {intersections
                .filter(i => !favoriteIds.includes(i.id))
                .map((intersection) => (
                  <div
                    key={intersection.id}
                    className="bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-all p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-300 truncate">{intersection.name}</div>
                      <div className="text-xs text-slate-500 truncate">{intersection.area}</div>
                    </div>
                    <FavoriteStarButton intersectionId={intersection.id} isFav={false} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
