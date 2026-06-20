import { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Calendar, MapPin, Tag, CheckSquare, Square, Edit3, Download, X, Check } from 'lucide-react';
import { RecordCard } from '@/components/RecordCard';
import { StatsOverview } from '@/components/StatsOverview';
import { useDataStore } from '@/store/useDataStore';
import { TimePeriod, TIME_PERIOD_LABELS, TAG_OPTIONS, TAG_LABELS } from '@/types';
import { formatDateTime, getDirectionLabel } from '@/utils/timeUtils';

export default function RecordsPage() {
  const { records, intersections, clearAllRecords, bulkDeleteRecords, bulkUpdateIntersection } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntersection, setSelectedIntersection] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [targetIntersectionId, setTargetIntersectionId] = useState<string>('');

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

  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedRecordIds(new Set());
    setShowBulkUpdateDialog(false);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedRecordIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecordIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRecordIds.size === filteredRecords.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRecordIds.size === 0) return;
    const message = `确定要删除选中的 ${selectedRecordIds.size} 条记录吗？此操作不可恢复。`;
    if (confirm(message)) {
      bulkDeleteRecords(Array.from(selectedRecordIds));
      setSelectedRecordIds(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleOpenBulkUpdateDialog = () => {
    if (selectedRecordIds.size === 0) return;
    setTargetIntersectionId(intersections[0]?.id || '');
    setShowBulkUpdateDialog(true);
  };

  const handleBulkUpdate = () => {
    if (!targetIntersectionId || selectedRecordIds.size === 0) return;
    const targetIntersection = intersections.find(i => i.id === targetIntersectionId);
    if (!targetIntersection) return;

    const message = `确定要将选中的 ${selectedRecordIds.size} 条记录的所属路口修改为「${targetIntersection.name}」吗？`;
    if (confirm(message)) {
      bulkUpdateIntersection(
        Array.from(selectedRecordIds),
        targetIntersection.id,
        targetIntersection.name
      );
      setSelectedRecordIds(new Set());
      setIsMultiSelectMode(false);
      setShowBulkUpdateDialog(false);
    }
  };

  const handleExport = () => {
    const recordsToExport = isMultiSelectMode && selectedRecordIds.size > 0
      ? filteredRecords.filter(r => selectedRecordIds.has(r.id))
      : filteredRecords;

    if (recordsToExport.length === 0) {
      alert('没有可导出的记录');
      return;
    }

    const headers = ['路口名称', '方向', '等待时长(秒)', '开始时间', '结束时间', '时段', '标签', '备注', '是否超限'];
    const rows = recordsToExport.map(record => [
      record.intersectionName,
      getDirectionLabel(record.direction),
      record.duration.toString(),
      formatDateTime(record.startTime),
      formatDateTime(record.endTime),
      TIME_PERIOD_LABELS[record.timePeriod],
      record.tag ? TAG_LABELS[record.tag] : '',
      record.note || '',
      record.isOverLimit ? '是' : '否'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `等待记录_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">等待记录</h1>
            <p className="text-slate-400 text-sm">查看历史等待数据</p>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleToggleMultiSelect}
                  className={`p-2 rounded-lg transition-colors ${
                    isMultiSelectMode
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title={isMultiSelectMode ? '退出多选模式' : '进入多选模式'}
                >
                  <CheckSquare className="w-5 h-5" />
                </button>
                {!isMultiSelectMode && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="清空所有记录"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isMultiSelectMode && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-amber-400 text-sm font-medium">
                已选择 {selectedRecordIds.size} / {filteredRecords.length} 条记录
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-amber-400 text-sm hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                {selectedRecordIds.size === filteredRecords.length ? (
                  <><CheckSquare className="w-4 h-4" /> 取消全选</>
                ) : (
                  <><Square className="w-4 h-4" /> 全选</>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectedRecordIds.size === 0}
                className="flex-1 min-w-[100px] py-2 px-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                批量删除
              </button>
              <button
                type="button"
                onClick={handleOpenBulkUpdateDialog}
                disabled={selectedRecordIds.size === 0 || intersections.length === 0}
                className="flex-1 min-w-[100px] py-2 px-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm font-medium"
              >
                <Edit3 className="w-4 h-4" />
                修改路口
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={selectedRecordIds.size === 0}
                className="flex-1 min-w-[100px] py-2 px-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                导出选中
              </button>
            </div>
          </div>
        )}

        {!isMultiSelectMode && filteredRecords.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="py-2 px-4 bg-slate-800/50 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              导出当前筛选结果 ({filteredRecords.length} 条)
            </button>
          </div>
        )}

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
              <RecordCard
                key={record.id}
                record={record}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedRecordIds.has(record.id)}
                onSelect={handleToggleSelect}
              />
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

      {showBulkUpdateDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">批量修改所属路口</h3>
              <button
                type="button"
                onClick={() => setShowBulkUpdateDialog(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">
                已选择 <span className="text-amber-400 font-medium">{selectedRecordIds.size}</span> 条记录
              </p>
              <p className="text-slate-500 text-xs">
                请选择要修改到的目标路口：
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                目标路口
              </label>
              <select
                value={targetIntersectionId}
                onChange={(e) => setTargetIntersectionId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {intersections.map((intersection) => (
                  <option key={intersection.id} value={intersection.id}>
                    {intersection.name} ({intersection.area})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBulkUpdateDialog(false)}
                className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={!targetIntersectionId}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
