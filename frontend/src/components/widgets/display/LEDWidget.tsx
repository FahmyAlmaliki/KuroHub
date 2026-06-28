import { usePinStore } from '../../../store/pinStore';
import type { Widget } from '../../../types';

interface LEDWidgetProps {
  widget: Widget;
}

export default function LEDWidget({ widget }: LEDWidgetProps) {
  const value = usePinStore((s) => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const config = widget.config as { color?: string };

  const isOn = value === '1' || value?.toLowerCase() === 'true' || value?.toLowerCase() === 'on';
  const color = config.color || (isOn ? '#22c55e' : '#ef4444');

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <span className="text-xs text-gray-400">{widget.label}</span>
      <div className="relative">
        <div
          className="w-12 h-12 rounded-full transition-all duration-500"
          style={{
            backgroundColor: color,
            opacity: isOn ? 1 : 0.15,
            boxShadow: isOn ? `0 0 24px 4px ${color}80` : 'none',
          }}
        />
      </div>
      <span className="text-xs font-medium" style={{ color, opacity: isOn ? 1 : 0.4 }}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
