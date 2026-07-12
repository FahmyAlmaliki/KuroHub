import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, History, Bell, Settings, LogOut, Grip } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/devices', icon: Cpu, label: 'Devices' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-screen">
      <aside className="w-60 border-r border-border bg-card flex flex-col">
        <div className="flex items-center gap-2 px-5 h-14 bg-gradient-to-r from-primary/90 via-primary/70 to-accent/60">
          <Grip className="w-5 h-5 text-white" />
          <span className="font-bold text-lg text-white">KuroHub</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-accent/20 to-accent/5 text-accent font-medium border-l-2 border-accent rounded-l-none'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent rounded-l-none'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium text-white shadow-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
