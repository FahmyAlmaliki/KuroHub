import { useMemo } from 'react';
import { usePinStore } from '../../../store/pinStore';
import type { Widget, GaugeConfig } from '../../../types';

interface GaugeWidgetProps {
  widget: Widget;
}

interface GaugeConfigWithDefaults extends GaugeConfig {
  min: number;
  max: number;
  warningThreshold: number;
  dangerThreshold: number;
  unit: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function GaugeWidget({ widget }: GaugeWidgetProps) {
  const value = usePinStore((s) => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const config = widget.config as unknown as GaugeConfigWithDefaults;

  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const warningThreshold = config.warningThreshold ?? 70;
  const dangerThreshold = config.dangerThreshold ?? 90;
  const unit = config.unit ?? '';

  const numVal = value !== undefined ? parseFloat(value) : NaN;
  const displayVal = isNaN(numVal) ? '—' : numVal.toFixed(0);

  const percent = isNaN(numVal) ? 0 : Math.max(0, Math.min(100, ((numVal - min) / (max - min)) * 100));

  const getColor = (pct: number) => {
    if (pct >= dangerThreshold) return '#ef4444';
    if (pct >= warningThreshold) return '#f59e0b';
    return '#60a5fa';
  };

  const gaugeColor = getColor(percent);

  const startAngle = 225;
  const endAngle = 495;
  const sweep = endAngle - startAngle;
  const valueAngle = startAngle + (percent / 100) * sweep;

  const cx = 100;
  const cy = 112;
  const r = 78;
  const strokeWidth = 12;
  const innerR = r - strokeWidth / 2;

  const bgArc = useMemo(() => describeArc(cx, cy, innerR, startAngle, endAngle), []);
  const valueArc = useMemo(() => describeArc(cx, cy, innerR, startAngle, valueAngle), [valueAngle]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-xs text-gray-400 truncate max-w-full mb-1">{widget.label}</span>
      <div className="relative flex-1 w-full flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full max-w-[180px] max-h-[180px]">
          <path d={bgArc} fill="none" stroke="#374151" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={valueArc} fill="none" stroke={gaugeColor} strokeWidth={strokeWidth} strokeLinecap="round" className="transition-all duration-500" />

          {/* Warning threshold tick */}
          {warningThreshold > 0 && warningThreshold < 100 && (
            <line
              x1={polarToCartesian(cx, cy, r - 4, startAngle + (warningThreshold / 100) * sweep).x}
              y1={polarToCartesian(cx, cy, r - 4, startAngle + (warningThreshold / 100) * sweep).y}
              x2={polarToCartesian(cx, cy, r + 4, startAngle + (warningThreshold / 100) * sweep).x}
              y2={polarToCartesian(cx, cy, r + 4, startAngle + (warningThreshold / 100) * sweep).y}
              stroke="#f59e0b" strokeWidth={2} strokeLinecap="round"
            />
          )}

          {/* Danger threshold tick */}
          {dangerThreshold > 0 && dangerThreshold < 100 && (
            <line
              x1={polarToCartesian(cx, cy, r - 4, startAngle + (dangerThreshold / 100) * sweep).x}
              y1={polarToCartesian(cx, cy, r - 4, startAngle + (dangerThreshold / 100) * sweep).y}
              x2={polarToCartesian(cx, cy, r + 4, startAngle + (dangerThreshold / 100) * sweep).x}
              y2={polarToCartesian(cx, cy, r + 4, startAngle + (dangerThreshold / 100) * sweep).y}
              stroke="#ef4444" strokeWidth={2} strokeLinecap="round"
            />
          )}

          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fontWeight="bold" fill="#F3F4F6" fontFamily="inherit">
            {displayVal}
          </text>
          {unit && (
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="inherit">
              {unit}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
