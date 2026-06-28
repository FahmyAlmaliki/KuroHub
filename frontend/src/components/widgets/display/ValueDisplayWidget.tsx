import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePinStore } from '../../../store/pinStore';
import type { Widget, ValueDisplayConfig } from '../../../types';

interface ValueDisplayWidgetProps {
  widget: Widget;
}

export default function ValueDisplayWidget({ widget }: ValueDisplayWidgetProps) {
  const value = usePinStore((s) => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const config = widget.config as unknown as ValueDisplayConfig;
  const prevValue = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (value !== undefined) {
      prevValue.current = value;
    }
  }, [value]);

  if (value === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1">
        <span className="text-xs text-gray-400 truncate max-w-full">{widget.label}</span>
        <span className="text-2xl font-bold text-gray-500">—</span>
      </div>
    );
  }

  const num = parseFloat(value);
  const displayValue = isNaN(num) ? value : num.toFixed(config.precision ?? 1);

  const fontSizeClass = config.fontSize === 'xl'
    ? 'text-4xl'
    : config.fontSize === 'sm'
      ? 'text-lg'
      : 'text-2xl';

  const trendColor = config.color || '#60a5fa';

  const prevNum = prevValue.current ? parseFloat(prevValue.current) : NaN;
  const trendUp = !isNaN(num) && !isNaN(prevNum) && num > prevNum;
  const trendDown = !isNaN(num) && !isNaN(prevNum) && num < prevNum;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <span className="text-xs text-gray-400 truncate max-w-full">{widget.label}</span>
      <span
        className={`font-bold ${fontSizeClass} leading-none tracking-tight`}
        style={{ color: trendColor }}
      >
        {displayValue}
      </span>
      {config.showTrend && (
        <div className="flex items-center gap-1 h-4">
          {trendUp ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : trendDown ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <span className="text-xs text-gray-500">—</span>
          )}
        </div>
      )}
    </div>
  );
}
