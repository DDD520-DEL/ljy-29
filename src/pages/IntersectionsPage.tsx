import { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, X, Save } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { Intersection } from '@/types';

export default function IntersectionsPage() {
  const { intersections, records, addIntersection, updateIntersection, deleteIntersection } = useDataStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', area: '', note: '' });

  const getRecordCount = (intersectionId: string) => {
    return records.filter(r => r.intersectionId === intersectionId).length;
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', area: '', note: '' });
    setShowForm(true);
  };

  const handleEdit = (intersection: Intersection) => {
    setEditingId(intersection.id);
    setFormData({
      name: intersection.name,
      area: intersection.area,
      note: intersection.note || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const recordCount = getRecordCount(id);
    const message = recordCount > 0
      ? `该路口有 ${recordCount} 条记录，确定要删除吗？`
      : '确定要删除这个路口吗？';
    if (confirm(message)) {
      deleteIntersection(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.area.trim()) return;

    if (editingId) {
      updateIntersection(editingId, formData);
    } else {
      addIntersection(formData);
    }
    setShowForm(false);
    setFormData({ name: '', area: '', note: '' });
    setEditingId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ name: '', area: '', note: '' });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">路口管理</h1>
            <p className="text-slate-400 text-sm">管理常用路口信息</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            添加
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">
                {editingId ? '编辑路口' : '添加路口'}
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  路口名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="例如：市中心"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="可选：补充说明"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim() || !formData.area.trim()}
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
            intersections.map((intersection) => (
              <div
                key={intersection.id}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all"
              >
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
                    <div className="text-xs text-slate-500 mt-2">
                      {getRecordCount(intersection.id)} 条记录
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(intersection)}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(intersection.id)}
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
                <MapPin className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400">暂无路口</p>
              <p className="text-slate-500 text-sm mt-1">点击上方按钮添加路口</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
