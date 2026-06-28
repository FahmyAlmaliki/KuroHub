import { useState } from 'react';
import { X } from 'lucide-react';
import type { Widget, ValueDisplayConfig, ButtonConfig, SliderConfig, GaugeConfig, ChartConfig } from '../../../types';

interface WidgetConfigModalProps {
  open: boolean;
  onClose: () => void;
  widget: Widget;
  onSave: (widgetId: string, label: string, config: Record<string, unknown>) => void;
}

export default function WidgetConfigModal({ open, onClose, widget, onSave }: WidgetConfigModalProps) {
  const [label, setLabel] = useState(widget.label);
  const [config, setConfig] = useState<Record<string, unknown>>({ ...widget.config });

  if (!open) return null;

  const update = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(widget.id, label, config);
    onClose();
  };

  const renderFields = () => {
    switch (widget.type) {
      case 'value_display': {
        const c = config as unknown as ValueDisplayConfig;
        return (
          <>
            <label className="block text-xs text-gray-400 mb-1">Precision (decimal places)</label>
            <input type="number" min={0} max={10} value={c.precision ?? 1}
              onChange={(e) => update('precision', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Font Size</label>
            <select value={c.fontSize ?? 'md'} onChange={(e) => update('fontSize', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="xl">Extra Large</option>
            </select>

            <label className="block text-xs text-gray-400 mb-1 mt-4">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={c.color ?? '#60a5fa'} onChange={(e) => update('color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
              <span className="text-xs text-gray-500">{c.color ?? '#60a5fa'}</span>
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={c.showTrend ?? false}
                onChange={(e) => update('showTrend', e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500" />
              <span className="text-xs text-gray-300">Show trend indicator</span>
            </label>
          </>
        );
      }

      case 'button': {
        const c = config as unknown as ButtonConfig;
        return (
          <>
            <label className="block text-xs text-gray-400 mb-1">On Value</label>
            <input type="text" value={c.onValue ?? '1'} onChange={(e) => update('onValue', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Off Value</label>
            <input type="text" value={c.offValue ?? '0'} onChange={(e) => update('offValue', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={c.color ?? '#3b82f6'} onChange={(e) => update('color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
              <span className="text-xs text-gray-500">{c.color ?? '#3b82f6'}</span>
            </div>

            <label className="block text-xs text-gray-400 mb-1 mt-4">Mode</label>
            <select value={c.mode ?? 'push'} onChange={(e) => update('mode', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="push">Push (hold to activate)</option>
              <option value="toggle">Toggle (click to switch)</option>
            </select>
          </>
        );
      }

      case 'slider': {
        const c = config as unknown as SliderConfig;
        return (
          <>
            <label className="block text-xs text-gray-400 mb-1">Minimum Value</label>
            <input type="number" value={c.min ?? 0} onChange={(e) => update('min', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Maximum Value</label>
            <input type="number" value={c.max ?? 100} onChange={(e) => update('max', parseFloat(e.target.value) || 100)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Step</label>
            <input type="number" min={0.1} step={0.1} value={c.step ?? 1} onChange={(e) => update('step', parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={c.color ?? '#3b82f6'} onChange={(e) => update('color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
              <span className="text-xs text-gray-500">{c.color ?? '#3b82f6'}</span>
            </div>
          </>
        );
      }

      case 'gauge': {
        const c = config as unknown as GaugeConfig;
        return (
          <>
            <label className="block text-xs text-gray-400 mb-1">Minimum Value</label>
            <input type="number" value={c.min ?? 0} onChange={(e) => update('min', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Maximum Value</label>
            <input type="number" value={c.max ?? 100} onChange={(e) => update('max', parseFloat(e.target.value) || 100)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Warning Threshold</label>
            <input type="number" value={c.warningThreshold ?? 70} onChange={(e) => update('warningThreshold', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Danger Threshold</label>
            <input type="number" value={c.dangerThreshold ?? 90} onChange={(e) => update('dangerThreshold', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <label className="block text-xs text-gray-400 mb-1 mt-4">Unit</label>
            <input type="text" value={c.unit ?? ''} onChange={(e) => update('unit', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. °C, %" />
          </>
        );
      }

      case 'line_chart':
      case 'area_chart': {
        const c = config as unknown as ChartConfig;
        return (
          <>
            <label className="block text-xs text-gray-400 mb-1">Time Range</label>
            <select value={c.timeRange ?? '1h'} onChange={(e) => update('timeRange', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>

            <label className="block text-xs text-gray-400 mb-1 mt-4">Line Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={c.color ?? '#60a5fa'} onChange={(e) => update('color', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
              <span className="text-xs text-gray-500">{c.color ?? '#60a5fa'}</span>
            </div>

            {widget.type === 'area_chart' && (
              <>
                <label className="block text-xs text-gray-400 mb-1 mt-4">Fill Opacity</label>
                <input type="range" min={0} max={1} step={0.05} value={c.fillOpacity ?? 0.2}
                  onChange={(e) => update('fillOpacity', parseFloat(e.target.value))}
                  className="w-full accent-blue-500" />
                <span className="text-xs text-gray-500">{c.fillOpacity ?? 0.2}</span>
              </>
            )}

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={c.showDots ?? false}
                onChange={(e) => update('showDots', e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500" />
              <span className="text-xs text-gray-300">Show data points</span>
            </label>
          </>
        );
      }

      default:
        return <p className="text-sm text-gray-500">No configuration options for this widget type.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-white">Configure Widget</h3>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{widget.type.replace('_', ' ')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          {renderFields()}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-700">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
