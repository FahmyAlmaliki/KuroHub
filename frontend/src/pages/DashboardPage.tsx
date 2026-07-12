import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDevices } from '../hooks/useDevices';
import { Activity, AlertTriangle, Cpu, Wifi, WifiOff, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: devices, isLoading, isError, error } = useDevices();

  const stats = useMemo(() => {
    if (!devices) return { total: 0, online: 0, offline: 0 };
    const online = devices.filter((d) => d.status === 'online').length;
    return {
      total: devices.length,
      online,
      offline: devices.length - online,
    };
  }, [devices]);

  const cards = [
    {
      title: 'Total Devices',
      value: stats.total,
      icon: Cpu,
      color: 'text-accent',
      bg: 'bg-accent/10',
      accent: 'border-l-accent',
    },
    {
      title: 'Online',
      value: stats.online,
      icon: Wifi,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      accent: 'border-l-emerald-500',
    },
    {
      title: 'Offline',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
      accent: 'border-l-muted-foreground',
    },
    {
      title: 'Active Alerts',
      value: 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      accent: 'border-l-amber-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Welcome{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1.5">
          Monitor your IoT ecosystem at a glance.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium mb-1">
            <AlertTriangle className="h-4 w-4" />
            Failed to load devices
          </div>
          <p className="text-destructive/80">{(error as Error)?.message ?? 'Unknown error'}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className={`rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${card.accent} overflow-hidden group`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <div className={`rounded-lg p-2.5 ${card.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{card.value}</p>
                  <div className="mt-2 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
                    <div className={`h-full rounded-full ${card.color.replace('text-', 'bg-')} w-3/5 opacity-50`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border/50 px-6 py-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Recent Activity</h2>
                <p className="text-xs text-muted-foreground">Latest device activity across your network</p>
              </div>
            </div>
            {!devices || devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <Cpu className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  No devices yet. Add your first device to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {devices.slice(0, 5).map((device, idx) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-mono text-muted-foreground">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            device.status === 'online' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-muted-foreground'
                          }`} />
                          <span className="text-sm font-medium">{device.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-4">
                          {device.pinCount} pins · {device.widgetCount} widgets
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        device.status === 'online'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {device.status === 'online' ? (
                          <><TrendingUp className="h-3 w-3" /> Online</>
                        ) : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
