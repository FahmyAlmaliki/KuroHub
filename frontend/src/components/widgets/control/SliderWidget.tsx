import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { usePinStore } from '../../../store/pinStore';
import type { Widget, SliderConfig } from '../../../types';

interface SliderWidgetProps {
  widget: Widget;
}

export default function SliderWidget({ widget }: SliderWidgetProps) {
  const config = widget.config as unknown as SliderConfig;
  const { sendPinWrite } = useWebSocket();
  const storeValue = usePinStore((s) => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const [localValue, setLocalValue] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const sliderMin = config.min ?? 0;
  const sliderMax = config.max ?? 100;
  const sliderStep = config.step ?? 1;
  const color = config.color ?? '#3b82f6';

  useEffect(() => {
    if (!isDragging && storeValue !== undefined) {
      const parsed = parseFloat(storeValue);
      setLocalValue(isNaN(parsed) ? sliderMin : parsed);
    }
  }, [storeValue, isDragging, sliderMin]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalValue(isNaN(val) ? sliderMin : val);
  }, [sliderMin]);

  const handleCommit = useCallback(() => {
    setIsDragging(false);
    sendPinWrite(widget.deviceId, widget.pinNumber, String(localValue));
  }, [sendPinWrite, widget.deviceId, widget.pinNumber, localValue]);

  const handleStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 truncate">{widget.label}</span>
        <span className="text-sm font-medium ml-2" style={{ color }}>{localValue}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 w-5 text-right shrink-0">{sliderMin}</span>
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          value={localValue}
          onChange={handleChange}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-gray-600 accent-blue-500"
          style={{
            accentColor: color,
          }}
        />
        <span className="text-xs text-gray-500 w-5 shrink-0">{sliderMax}</span>
      </div>
    </div>
  );
}
