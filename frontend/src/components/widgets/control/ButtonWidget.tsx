import { useState, useCallback } from 'react';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { usePinStore } from '../../../store/pinStore';
import type { Widget, ButtonConfig } from '../../../types';

interface ButtonWidgetProps {
  widget: Widget;
}

export default function ButtonWidget({ widget }: ButtonWidgetProps) {
  const config = widget.config as unknown as ButtonConfig;
  const { sendPinWrite } = useWebSocket();
  const currentValue = usePinStore((s) => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const [active, setActive] = useState(false);

  const mode = config.mode ?? 'push';
  const onValue = config.onValue ?? '1';
  const offValue = config.offValue ?? '0';
  const color = config.color ?? '#3b82f6';

  const isToggleMode = mode === 'toggle';
  const isOn = currentValue === onValue;
  const buttonActive = isToggleMode ? isOn : active;

  const handleClick = useCallback(() => {
    if (!isToggleMode) return;
    sendPinWrite(widget.deviceId, widget.pinNumber, isOn ? offValue : onValue);
  }, [isToggleMode, isOn, onValue, offValue, sendPinWrite, widget.deviceId, widget.pinNumber]);

  const handlePointerDown = useCallback(() => {
    if (isToggleMode) return;
    setActive(true);
    sendPinWrite(widget.deviceId, widget.pinNumber, onValue);
  }, [isToggleMode, onValue, sendPinWrite, widget.deviceId, widget.pinNumber]);

  const handlePointerUp = useCallback(() => {
    if (isToggleMode) return;
    setActive(false);
    sendPinWrite(widget.deviceId, widget.pinNumber, offValue);
  }, [isToggleMode, offValue, sendPinWrite, widget.deviceId, widget.pinNumber]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <span className="text-xs text-gray-400 truncate max-w-full">{widget.label}</span>
      <button
        onClick={handleClick}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={!isToggleMode ? handlePointerUp : undefined}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-sm select-none transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
        style={{
          backgroundColor: color,
          opacity: buttonActive ? 1 : 0.65,
          boxShadow: buttonActive ? `0 0 24px 4px ${color}60` : '0 2px 8px rgba(0,0,0,0.3)',
          transform: buttonActive ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        {buttonActive ? onValue : offValue}
      </button>
    </div>
  );
}
