import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { subHours } from 'date-fns';
import { usePinStore } from '../../../store/pinStore';
import { getHistory } from '../../../services/virtualpin.service';
import type { Widget, ChartConfig } from '../../../types';

interface DataPoint {
  time: string;
  value: number;
}

const MAX_POINTS = 200;

export default function AreaChartWidget({ widget }: { widget: Widget }) {
  const config = widget.config as unknown as ChartConfig;
  const liveValue = usePinStore((s) => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const [data, setData] = useState<DataPoint[]>([]);
  const bufferRef = useRef<DataPoint[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const range = (config.timeRange as string) ?? '1h';
        const hours = parseInt(range.replace('h', ''));
        const from = subHours(new Date(), isNaN(hours) ? 1 : hours).toISOString();
        const res = await getHistory(widget.deviceId, widget.pinNumber, { from, resolution: '1m', fn: 'mean' });
        if (res.success && res.data) {
          const pts = res.data.points.map((p) => ({ time: p.timestamp, value: p.value }));
          bufferRef.current = pts;
          setData(pts);
        }
      } catch {
        /* silent fail */
      }
    };
    fetchHistory();
  }, [widget.deviceId, widget.pinNumber, config.timeRange]);

  useEffect(() => {
    if (liveValue === undefined) return;
    const num = parseFloat(liveValue);
    if (isNaN(num)) return;

    const point: DataPoint = { time: new Date().toISOString(), value: num };
    const next = [...bufferRef.current, point];
    bufferRef.current = next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    setData(bufferRef.current);
  }, [liveValue]);

  const color = config.color || '#60a5fa';
  const fillOpacity = config.fillOpacity ?? 0.2;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <span className="text-xs">{widget.label}</span>
        <span className="text-sm mt-2">No data</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs text-gray-400 truncate shrink-0 mb-1">{widget.label}</span>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickFormatter={(v: string) => {
                try {
                  return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch {
                  return '';
                }
              }}
              stroke="#4B5563"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              stroke="#4B5563"
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#E5E7EB',
              }}
              labelFormatter={(v: string) => {
                try {
                  return new Date(v).toLocaleString();
                } catch {
                  return v;
                }
              }}
            />
            <defs>
              <linearGradient id={`fill-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={fillOpacity} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${widget.id})`}
              dot={config.showDots ? { r: 3, fill: color, strokeWidth: 0 } : false}
              activeDot={{ r: 5, fill: color }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
