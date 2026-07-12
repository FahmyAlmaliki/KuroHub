import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useDevices } from '../hooks/useDevices';
import { usePins } from '../hooks/useVirtualPin';
import { getHistory, type HistoryResponse } from '../services/virtualpin.service';
import { Loader2, History, Download, Calendar, Cpu } from 'lucide-react';

export function HistoryPage() {
  const { data: devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedPin, setSelectedPin] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
  );
  const [endDate, setEndDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  const { data: pins } = usePins(selectedDevice);

  const {
    data: historyData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pinHistory', selectedDevice, selectedPin, startDate, endDate],
    queryFn: async () => {
      if (!selectedDevice || selectedPin === '') return [];
      const res = await getHistory(selectedDevice, Number(selectedPin), {
        from: startDate,
        to: endDate,
        resolution: '5m',
        fn: 'mean',
      });
      return res.data ?? { pinNumber: Number(selectedPin), field: '', points: [] };
    },
    enabled: !!selectedDevice && selectedPin !== '',
  });

  const chartData = useMemo(() => {
    const hd = historyData as HistoryResponse | undefined;
    if (!hd?.points) return [];
    return hd.points.map((point) => ({
      time: point.timestamp,
      value: point.value,
    }));
  }, [historyData]);

  const deviceOptions = useMemo(() => {
    if (!devices) return [];
    return devices.map((d) => ({ value: d.id, label: d.name }));
  }, [devices]);

  const pinOptions = useMemo(() => {
    if (!pins) return [];
    return pins.map((p) => ({ value: p.pinNumber, label: `V${p.pinNumber} — ${p.label}${p.unit ? ` (${p.unit})` : ''}` }));
  }, [pins]);

  const handleExport = () => {
    const hd = historyData as HistoryResponse | undefined;
    if (!hd?.points?.length) return;
    const csv = ['time,value', ...hd.points.map((p) => `${p.timestamp},${p.value}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_${selectedDevice}_V${selectedPin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (time: string) => {
    try {
      return format(parseISO(time), 'HH:mm');
    } catch {
      return time;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            View historical pin data
          </p>
        </div>
        {historyData && typeof historyData === 'object' && 'points' in historyData && (historyData as HistoryResponse).points.length > 0 && (
          <button
            onClick={handleExport}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/50 bg-card px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
            Device
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => {
              setSelectedDevice(e.target.value);
              setSelectedPin('');
            }}
            className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            <option value="">Select device</option>
            {deviceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <span className="font-mono text-xs text-muted-foreground">V</span>
            Virtual Pin
          </label>
          <select
            value={selectedPin}
            onChange={(e) => setSelectedPin(e.target.value ? Number(e.target.value) : '')}
            disabled={!selectedDevice}
            className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all disabled:opacity-50"
          >
            <option value="">Select pin</option>
            {pinOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            From
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            To
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          />
        </div>
      </div>

      {/* Chart */}
      {!selectedDevice || selectedPin === '' ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/50 py-24">
          <div className="rounded-full bg-muted p-4 mb-4">
            <History className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">Select device and pin</h3>
          <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-sm">
            Choose a device and virtual pin to view historical data.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-sm text-destructive">
          Failed to load history: {(error as Error)?.message ?? 'Unknown error'}
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/50 py-24">
          <History className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No data</h3>
          <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-sm">
            No historical data for the selected period.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                labelFormatter={(label) => {
                  try {
                    return format(parseISO(label as string), 'MMM dd, HH:mm:ss');
                  } catch {
                    return label;
                  }
                }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: 13,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
