import { useCallback } from 'react';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { usePinStore } from '../../../store/pinStore';
import type { Widget } from '../../../types';

interface ToggleWidgetProps {
  widget: Widget;
}

export default function ToggleWidget({ widget }: ToggleWidgetProps) {
  const config = widget.config as { onValue?: string; offValue?: string };
  const { sendPinWrite } = useWebSocket();
  const currentValue = usePinStore((s) => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const onValue = config.onValue || '1';
  const offValue = config.offValue || '0';
  const isOn = currentValue === onValue;

  const handleToggle = useCallback(() => {
    sendPinWrite(widget.deviceId, widget.pinNumber, isOn ? offValue : onValue);
  }, [sendPinWrite, widget.deviceId, widget.pinNumber, isOn, onValue, offValue]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <span className="text-xs text-gray-400 truncate max-w-full">{widget.label}</span>
      <button
        onClick={handleToggle}
        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
          isOn ? 'bg-blue-500' : 'bg-gray-600'
        }`}
        role="switch"
        aria-checked={isOn}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
            isOn ? 'translate-x-7' : 'translate-x-0'
          }`}
        />
      </button>
      <span className={`text-xs font-medium ${isOn ? 'text-blue-400' : 'text-gray-500'}`}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
