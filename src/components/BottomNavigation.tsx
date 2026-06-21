import { NavLink } from 'react-router-dom';
import { Home, Timer, ListTodo, BarChart3, MapPin, Star, Settings, CalendarDays } from 'lucide-react';

export function BottomNavigation() {
  const navItems = [
    { to: '/', label: '首页', icon: Home },
    { to: '/timer', label: '计时', icon: Timer },
    { to: '/records', label: '记录', icon: ListTodo },
    { to: '/analysis', label: '分析', icon: BarChart3 },
    { to: '/weekly-report', label: '周报', icon: CalendarDays },
    { to: '/favorites', label: '收藏', icon: Star },
    { to: '/intersections', label: '路口', icon: MapPin },
    { to: '/settings', label: '设置', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
