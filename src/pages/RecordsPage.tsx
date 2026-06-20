import { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Calendar, MapPin, Tag } from 'lucide-react';
import { RecordCard } from '@/components/RecordCard';
import { StatsOverview } from '@/components/StatsOverview';
import { useDataStore } from '@/store/useDataStore';
import { TimePeriod, TIME_PERIOD_LABELS, TAG_OPTIONS, Tag as TagType } from '@/types';

export default function RecordsPage() {
  const { records, intersections, clearAllRecords } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntersection, setSelectedIntersection] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (searchQuery && !record.intersectionName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedIntersection !== 'all' && record.intersectionId !== selectedIntersection) {
        return false;
      }
      if (selectedPeriod !== 'all' && record.timePeriod !== selectedPeriod) {
        return false;
      }
      if (selectedTag !== 'all' && record.tag !== selectedTag) {
        return false;
      }
      return true;
    });
  }, [records, searchQuery, selectedIntersection, selectedPeriod, selectedTag]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { totalRecords: 0, avgDuration: 0, maxDuration: 0, totalDuration: 0 };
    }
    const totalDuration = filteredRecords.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / filteredRecords.length;
    const maxDuration = Math.max(...filteredRecords.map(r => r.duration));
    return {
      totalRecords: filteredRecords.length,
      avgDuration,
      maxDuration,
      totalDuration,
    };
  }, [filteredRecords]);

  const handleClearAll = () => {
    if (confirm('确定要删除所有记录吗？此操作不可恢复。')) {
      clearAllRecords();
    }
  };

  const hasActiveFilter = selectedIntersection !== 'all' || selectedPeriod !== 'all' || selectedTag !== 'all';

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">等待记录</h1>
            <p className="text-slate-400 text-sm">查看历史等待数据</p>
          </div>
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="清空所有记录"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mb-6">
          <StatsOverview
            totalRecords={stats.totalRecords}
            avgDuration={stats.avgDuration}
            maxDuration={stats.maxDuration}
            totalDuration={stats.totalDuration}
          />
        </div>

        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索路口名称..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilter ? (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            ) : null}
          </button>

          {showFilters && (
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <MapPin className="w-4 h-4" />
                  路口
                </label>
                <select
                  value={selectedIntersection}
                  onChange={(e) => setSelectedIntersection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">全部路口</option>
                  {intersections.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  时段
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TIME_PERIOD_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPeriod(selectedPeriod === key ? 'all' : key as TimePeriod)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedPeriod === key
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                  <Tag className="w-4 h-4" />
                  标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedTag(selectedTag === option.value ? 'all' : option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedTag === option.value
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
          )}
        </div>

        <div className="space-y-3">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400">暂无记录</p>
              <p className="text-slate-500 text-sm mt-1">开始你的第一次等待计时吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
