import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, MapPin, Folder, X } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useNavigate } from 'react-router-dom';

interface IntersectionSelectorProps {
  disabled?: boolean;
}

export function IntersectionSelector({ disabled = false }: IntersectionSelectorProps) {
  const { intersections, groups, selectedIntersectionId, setSelectedIntersection } = useDataStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const selectedIntersection = intersections.find(i => i.id === selectedIntersectionId);

  const filteredIntersections = intersections.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.area.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      const matchesGroup = group?.intersectionIds.includes(i.id) || false;
      return matchesSearch && matchesGroup;
    }

    return matchesSearch;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setSelectedIntersection(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl flex items-center justify-between text-left transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700 hover:border-slate-500 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-amber-400" />
          <div>
            <div className="font-medium text-white">
              {selectedIntersection?.name || '请选择路口'}
            </div>
            {selectedIntersection && (
              <div className="text-xs text-slate-400">{selectedIntersection.area}</div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-700">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索路口名称或区域..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>

            {groups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <Folder className="w-3.5 h-3.5" />
                  按分组筛选
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedGroupId(null)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedGroupId === null
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    全部
                  </button>
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                        selectedGroupId === group.id
                          ? 'text-white'
                          : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: selectedGroupId === group.id ? group.color : group.color + '30',
                        color: selectedGroupId === group.id ? 'white' : group.color,
                      }}
                    >
                      {group.name}
                      {selectedGroupId === group.id && <X className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredIntersections.length > 0 ? (
              filteredIntersections.map((intersection) => {
                const intersectionGroups = groups.filter(g => g.intersectionIds.includes(intersection.id));
                return (
                  <button
                    key={intersection.id}
                    type="button"
                    onClick={() => handleSelect(intersection.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors ${
                      intersection.id === selectedIntersectionId ? 'bg-slate-700' : ''
                    }`}
                  >
                    <div className="font-medium text-white">{intersection.name}</div>
                    <div className="text-xs text-slate-400">{intersection.area}</div>
                    {intersectionGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {intersectionGroups.slice(0, 3).map((group) => (
                          <span
                            key={group.id}
                            className="px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: group.color + '25', color: group.color }}
                          >
                            {group.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-slate-400 text-sm">
                {selectedGroup
                  ? `"${selectedGroup.name}" 分组下没有路口`
                  : '没有找到匹配的路口'}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-700">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/intersections');
              }}
              className="w-full px-4 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              管理路口
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
