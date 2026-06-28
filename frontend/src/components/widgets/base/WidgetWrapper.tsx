import { type ReactNode } from 'react';
import { GripHorizontal, Settings, Trash2 } from 'lucide-react';
import type { Widget } from '../../../types';
import { cn } from '../../../lib/utils';
import ValueDisplayWidget from '../display/ValueDisplayWidget';
import LEDWidget from '../display/LEDWidget';
import LineChartWidget from '../chart/LineChartWidget';
import AreaChartWidget from '../chart/AreaChartWidget';
import GaugeWidget from '../chart/GaugeWidget';
import ButtonWidget from '../control/ButtonWidget';
import ToggleWidget from '../control/ToggleWidget';
import SliderWidget from '../control/SliderWidget';

interface WidgetWrapperProps {
  widget: Widget;
  isEditMode: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  children?: ReactNode;
}

function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'value_display':
      return <ValueDisplayWidget widget={widget} />;
    case 'led':
      return <LEDWidget widget={widget} />;
    case 'line_chart':
      return <LineChartWidget widget={widget} />;
    case 'area_chart':
      return <AreaChartWidget widget={widget} />;
    case 'gauge':
      return <GaugeWidget widget={widget} />;
    case 'button':
      return <ButtonWidget widget={widget} />;
    case 'toggle':
      return <ToggleWidget widget={widget} />;
    case 'slider':
      return <SliderWidget widget={widget} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          Unknown widget type: {widget.type}
        </div>
      );
  }
}

export default function WidgetWrapper({ widget, isEditMode, onDelete, onEdit, children }: WidgetWrapperProps) {
  return (
    <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 h-full flex flex-col overflow-hidden group">
      {isEditMode && (
        <div className="widget-drag-handle flex items-center justify-between px-3 py-1.5 bg-gray-700/60 border-b border-gray-700/50 cursor-grab active:cursor-grabbing select-none shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <GripHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-xs font-medium text-gray-300 truncate">
              {widget.label}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(widget.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-gray-600 transition-colors"
                title="Configure"
              >
                <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(widget.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-gray-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className={cn('flex-1 p-3 overflow-hidden', isEditMode && 'pointer-events-none')}>
        {children ?? <WidgetRenderer widget={widget} />}
      </div>
      {isEditMode && (
        <div className="absolute bottom-1 right-1 text-gray-600 pointer-events-none">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15L15 21" />
            <path d="M21 9L9 21" />
            <path d="M21 3L3 21" />
          </svg>
        </div>
      )}
    </div>
  );
}
