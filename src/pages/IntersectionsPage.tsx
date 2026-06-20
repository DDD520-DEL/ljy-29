import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, MapPin, X, Save, FolderPlus, Check, Folder, Clock, Award, ChevronDown, ChevronUp, Lightbulb, BarChart3 } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { Intersection, IntersectionGroup, GROUP_COLORS, GRADE_LABELS, GRADE_COLORS, TimingScore } from '@/types';
import { calculateAllTimingScores } from '@/utils/timingScore';

type TabType = 'intersections' | 'groups';

export default function IntersectionsPage() {
  const { intersections, records, groups, addIntersection, updateIntersection, deleteIntersection,
    addGroup, updateGroup, deleteGroup, toggleIntersectionInGroup } = useDataStore();

  const [activeTab, setActiveTab] = useState<TabType>('intersections');
  const [expandedIntersectionId, setExpandedIntersectionId] = useState<string | null>(null);

  const [showIntersectionForm, setShowIntersectionForm] = useState(false);
  const [editingIntersectionId, setEditingIntersectionId] = useState<string | null>(null);
  const [intersectionFormData, setIntersectionFormData] = useState({ name: '', area: '', note: '', reasonableWaitTime: '' });

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '', color: GROUP_COLORS[0], intersectionIds: [] as string[] });

  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);

  const getRecordCount = (intersectionId: string) => {
    return records.filter(r => r.intersectionId === intersectionId).length;
  };

  const getIntersectionGroups = (intersectionId: string) => {
    return groups.filter(g => g.intersectionIds.includes(intersectionId));
  };

  const timingScores = useMemo(() => {
    return calculateAllTimingScores(intersections, records);
  }, [intersections, records]);

  const toggleExpand = (intersectionId: string) => {
    setExpandedIntersectionId(expandedIntersectionId === intersectionId ? null : intersectionId);
  };

  const handleAddIntersection = () => {
    setEditingIntersectionId(null);
    setIntersectionFormData({ name: '', area: '', note: '', reasonableWaitTime: '' });
    setShowIntersectionForm(true);
  };

  const handleEditIntersection = (intersection: Intersection) => {
    setEditingIntersectionId(intersection.id);
    setIntersectionFormData({
      name: intersection.name,
      area: intersection.area,
      note: intersection.note || '',
      reasonableWaitTime: intersection.reasonableWaitTime?.toString() || '',
    });
    setShowIntersectionForm(true);
  };

  const handleDeleteIntersection = (id: string) => {
    const recordCount = getRecordCount(id);
    const message = recordCount > 0
      ? `该路口有 ${recordCount} 条记录，确定要删除吗？`
      : '确定要删除这个路口吗？';
    if (confirm(message)) {
      deleteIntersection(id);
    }
  };

  const handleSubmitIntersection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intersectionFormData.name.trim() || !intersectionFormData.area.trim()) return;

    const submitData = {
      name: intersectionFormData.name,
      area: intersectionFormData.area,
      note: intersectionFormData.note || undefined,
      reasonableWaitTime: intersectionFormData.reasonableWaitTime
        ? parseInt(intersectionFormData.reasonableWaitTime, 10)
        : undefined,
    };

    if (editingIntersectionId) {
      updateIntersection(editingIntersectionId, submitData);
    } else {
      addIntersection(submitData);
    }
    setShowIntersectionForm(false);
    setIntersectionFormData({ name: '', area: '', note: '', reasonableWaitTime: '' });
    setEditingIntersectionId(null);
  };

  const handleCancelIntersection = () => {
    setShowIntersectionForm(false);
    setIntersectionFormData({ name: '', area: '', note: '', reasonableWaitTime: '' });
    setEditingIntersectionId(null);
  };

  const handleAddGroup = () => {
    setEditingGroupId(null);
    setGroupFormData({ name: '', description: '', color: GROUP_COLORS[0], intersectionIds: [] });
    setShowGroupForm(true);
  };

  const handleEditGroup = (group: IntersectionGroup) => {
    setEditingGroupId(group.id);
    setGroupFormData({
      name: group.name,
      description: group.description || '',
      color: group.color,
      intersectionIds: [...group.intersectionIds],
    });
    setShowGroupForm(true);
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm('确定要删除这个分组吗？')) {
      deleteGroup(id);
      if (managingGroupId === id) {
        setManagingGroupId(null);
      }
    }
  };

  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name.trim()) return;

    if (editingGroupId) {
      updateGroup(editingGroupId, groupFormData);
    } else {
      addGroup(groupFormData);
    }
    setShowGroupForm(false);
    setGroupFormData({ name: '', description: '', color: GROUP_COLORS[0], intersectionIds: [] });
    setEditingGroupId(null);
  };

  const handleCancelGroup = () => {
    setShowGroupForm(false);
    setGroupFormData({ name: '', description: '', color: GROUP_COLORS[0], intersectionIds: [] });
    setEditingGroupId(null);
  };

  const managingGroup = groups.find(g => g.id === managingGroupId);

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">路口管理</h1>
          <p className="text-slate-400 text-sm">管理路口和自定义分组</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('intersections'); setManagingGroupId(null); }}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'intersections'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              路口列表
            </div>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('groups'); setManagingGroupId(null); }}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'groups'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Folder className="w-4 h-4" />
              分组管理
            </div>
          </button>
        </div>

        {activeTab === 'intersections' && (
          <>
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">路口列表</h2>
            <button
              type="button"
              onClick={handleAddIntersection}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              添加路口
            </button>
          </div>

            {showIntersectionForm && (
              <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">
                    {editingIntersectionId ? '编辑路口' : '添加路口'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelIntersection}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmitIntersection} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      路口名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={intersectionFormData.name}
                      onChange={(e) => setIntersectionFormData({ ...intersectionFormData, name: e.target.value })}
                      placeholder="例如：人民大道与中山街交叉口"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      所属区域 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={intersectionFormData.area}
                      onChange={(e) => setIntersectionFormData({ ...intersectionFormData, area: e.target.value })}
                      placeholder="例如：市中心"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      合理等待时长（秒）
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={intersectionFormData.reasonableWaitTime}
                      onChange={(e) => setIntersectionFormData({ ...intersectionFormData, reasonableWaitTime: e.target.value })}
                      placeholder="例如：90，不设置则不启用超限提醒"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      超过该时长将显示超限提醒并触发振动（移动端）
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      备注
                    </label>
                    <textarea
                      value={intersectionFormData.note}
                      onChange={(e) => setIntersectionFormData({ ...intersectionFormData, note: e.target.value })}
                      placeholder="可选：补充说明"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancelIntersection}
                      className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={!intersectionFormData.name.trim() || !intersectionFormData.area.trim()}
                      className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {intersections.length > 0 ? (
              intersections.map((intersection) => {
                const intersectionGroups = getIntersectionGroups(intersection.id);
                const score = timingScores.get(intersection.id);
                const isExpanded = expandedIntersectionId === intersection.id;
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
                          {intersection.reasonableWaitTime !== undefined && intersection.reasonableWaitTime > 0 && (
                            <div className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              合理等待 {intersection.reasonableWaitTime} 秒
                            </div>
                          )}
                          {intersectionGroups.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {intersectionGroups.map((group) => (
                                <span
                                  key={group.id}
                                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: group.color + '25', color: group.color }}
                                >
                                  {group.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-slate-500">
                              {getRecordCount(intersection.id)} 条记录
                            </span>
                            {score && (
                              <div className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" style={{ color: GRADE_COLORS[score.grade] }} />
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: GRADE_COLORS[score.grade] }}
                                >
                                  配时评分 {score.totalScore} · {GRADE_LABELS[score.grade]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {score && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(intersection.id)}
                              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEditIntersection(intersection)}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIntersection(intersection.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {score && isExpanded && (
                      <div className="border-t border-slate-700/50 px-4 py-4 bg-slate-900/30">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-white">评分详情</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">平均时长</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.avgDurationScore}</span>
                                <span className="text-xs text-slate-500">{score.details.avgDuration}s</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.avgDurationScore}%`, backgroundColor: '#3b82f6' }}
                                />
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">峰谷差异</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.peakValleyScore}</span>
                                <span className="text-xs text-slate-500">峰{score.details.peakAvg}s</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.peakValleyScore}%`, backgroundColor: '#8b5cf6' }}
                                />
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">稳定性</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.varianceScore}</span>
                                <span className="text-xs text-slate-500">方差{score.details.variance}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.varianceScore}%`, backgroundColor: '#10b981' }}
                                />
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3">
                              <div className="text-xs text-slate-400 mb-1">超限率</div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">{score.dimensions.overLimitScore}</span>
                                <span className="text-xs text-slate-500">{score.details.overLimitRate}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${score.dimensions.overLimitScore}%`, backgroundColor: '#f59e0b' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-white">优化建议</span>
                          </div>
                          <div className="space-y-2">
                            {score.suggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 text-sm text-slate-300 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3"
                              >
                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400">暂无路口</p>
                <p className="text-slate-500 text-sm mt-1">点击上方按钮添加路口</p>
              </div>
            )}
            </div>
          </>
        )}

        {activeTab === 'groups' && !managingGroupId && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">分组列表</h2>
              <button
                type="button"
                onClick={handleAddGroup}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                <FolderPlus className="w-5 h-5" />
                添加分组
              </button>
            </div>

            {showGroupForm && (
              <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">
                    {editingGroupId ? '编辑分组' : '添加分组'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelGroup}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmitGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      分组名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={groupFormData.name}
                      onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                      placeholder="例如：上班路线"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      分组描述
                    </label>
                    <input
                      type="text"
                      value={groupFormData.description}
                      onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                      placeholder="可选：分组用途说明"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      分组颜色
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GROUP_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setGroupFormData({ ...groupFormData, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            groupFormData.color === color
                              ? 'border-white scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      选择路口
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-700 rounded-lg p-2">
                      {intersections.length > 0 ? (
                        intersections.map((intersection) => {
                          const isSelected = groupFormData.intersectionIds.includes(intersection.id);
                          return (
                            <button
                              key={intersection.id}
                              type="button"
                              onClick={() => {
                                const newIds = isSelected
                                  ? groupFormData.intersectionIds.filter(id => id !== intersection.id)
                                  : [...groupFormData.intersectionIds, intersection.id];
                                setGroupFormData({ ...groupFormData, intersectionIds: newIds });
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-amber-500/20 border border-amber-500/50'
                                  : 'bg-slate-700/50 hover:bg-slate-700'
                              }`}
                            >
                              <span className={isSelected ? 'text-amber-400' : 'text-slate-300'}>
                                {intersection.name}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-slate-500 text-sm">
                          暂无路口
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancelGroup}
                      className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={!groupFormData.name.trim()}
                      className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer"
                    onClick={() => setManagingGroupId(group.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: group.color + '25' }}
                      >
                        <Folder className="w-5 h-5" style={{ color: group.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-slate-400">{group.description}</div>
                        )}
                        <div className="text-xs text-slate-500 mt-2">
                          {group.intersectionIds.length} 个路口
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroup(group);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                    <Folder className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400">暂无分组</p>
                  <p className="text-slate-500 text-sm mt-1">点击上方按钮添加分组</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'groups' && managingGroup && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setManagingGroupId(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                管理分组成员
              </h2>
            </div>

            <div
              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: managingGroup.color + '25' }}
                >
                  <Folder className="w-6 h-6" style={{ color: managingGroup.color }} />
                </div>
                <div>
                  <div className="font-medium text-white">{managingGroup.name}</div>
                  {managingGroup.description && (
                    <div className="text-sm text-slate-400">{managingGroup.description}</div>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-400">
                点击路口可添加或移除出该分组，同一个路口可以属于多个分组
              </p>
            </div>

            <div className="space-y-2">
              {intersections.length > 0 ? (
                intersections.map((intersection) => {
                  const isInGroup = managingGroup.intersectionIds.includes(intersection.id);
                  return (
                    <button
                      key={intersection.id}
                      type="button"
                      onClick={() => toggleIntersectionInGroup(managingGroup.id, intersection.id)}
                      className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all ${
                        isInGroup
                          ? 'bg-slate-800 border-2'
                          : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                      }`}
                      style={isInGroup ? { borderColor: managingGroup.color + '75' } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{intersection.name}</div>
                          <div className="text-xs text-slate-400">{intersection.area}</div>
                        </div>
                      </div>
                      {isInGroup && (
                        <div
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: managingGroup.color + '25', color: managingGroup.color }}
                        >
                          <Check className="w-3 h-3" />
                          已加入
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">暂无路口</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
