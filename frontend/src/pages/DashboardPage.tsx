import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDevices } from '../hooks/useDevices';
import { Activity, AlertTriangle, Cpu, Wifi, WifiOff } from 'lucide-react';

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
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Online',
      value: stats.online,
      icon: Wifi,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Offline',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      title: 'Active Alerts',
      value: 0,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your IoT dashboard.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load devices: {(error as Error)?.message ?? 'Unknown error'}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Recent Activity</h2>
            </div>
            {!devices || devices.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No devices yet. Add your first device to get started.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {devices.slice(0, 5).map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          device.status === 'online'
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground'
                        }`}
                      />
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </span>
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
