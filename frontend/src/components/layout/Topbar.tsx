import { usePinStore } from '../../store/pinStore';
import { Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const deviceStatuses = usePinStore((s) => s.deviceStatuses);
  const onlineCount = Object.values(deviceStatuses).filter((s) => s === 'online').length;
  const offlineCount = Object.values(deviceStatuses).filter((s) => s === 'offline').length;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {onlineCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-green-500" />
              {onlineCount} online
            </span>
          )}
          {offlineCount > 0 && (
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
              {offlineCount} offline
            </span>
          )}
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
