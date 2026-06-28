import { useState, useEffect } from 'react';
import {
  X, Hash, TrendingUp, Gauge, MousePointer, ToggleLeft, SlidersHorizontal, Circle, AreaChart, ChevronLeft, Loader2, Plus,
} from 'lucide-react';
import { getPins, upsertPin } from '../../services/virtualpin.service';
import { toast } from 'sonner';
import type { WidgetType, VirtualPin } from '../../types';

interface WidgetPickerModalProps {
  open: boolean;
  onClose: () => void;
  deviceId: string;
  onSubmit: (data: { type: WidgetType; pinNumber: number; label: string; config: Record<string, unknown> }) => void;
}

interface WidgetTypeInfo {
  type: WidgetType;
  icon: React.ElementType;
  label: string;
  desc: string;
}

const widgetTypes: WidgetTypeInfo[] = [
  { type: 'value_display', icon: Hash, label: 'Value Display', desc: 'Show numeric value from a pin' },
  { type: 'line_chart', icon: TrendingUp, label: 'Line Chart', desc: 'Historical line chart' },
  { type: 'gauge', icon: Gauge, label: 'Gauge', desc: 'Analog gauge display' },
  { type: 'button', icon: MousePointer, label: 'Button', desc: 'Push or toggle button' },
  { type: 'toggle', icon: ToggleLeft, label: 'Toggle', desc: 'On/Off toggle switch' },
  { type: 'slider', icon: SlidersHorizontal, label: 'Slider', desc: 'Range slider control' },
  { type: 'led', icon: Circle, label: 'LED', desc: 'On/Off indicator light' },
  { type: 'area_chart', icon: AreaChart, label: 'Area Chart', desc: 'Filled area chart' },
];

function defaultConfig(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case 'value_display':
      return { precision: 1, fontSize: 'md', color: '#60a5fa', showTrend: false };
    case 'button':
      return { onValue: '1', offValue: '0', color: '#3b82f6', mode: 'push' };
    case 'slider':
      return { min: 0, max: 100, step: 1, color: '#3b82f6' };
    case 'gauge':
      return { min: 0, max: 100, warningThreshold: 70, dangerThreshold: 90, unit: '' };
    case 'line_chart':
      return { timeRange: '1h', color: '#60a5fa', fillOpacity: 0.2, showDots: false };
    case 'area_chart':
      return { timeRange: '1h', color: '#60a5fa', fillOpacity: 0.2, showDots: false };
    default:
      return {};
  }
}

function ConfigFields({ type, config, onChange }: { type: WidgetType; config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const update = (key: string, value: unknown) => onChange({ ...config, [key]: value });

  switch (type) {
    case 'value_display':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Precision</label>
            <input type="number" min={0} max={10} value={(config.precision as number) ?? 1}
              onChange={(e) => update('precision', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Font Size</label>
            <select value={(config.fontSize as string) ?? 'md'} onChange={(e) => update('fontSize', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Color</label>
            <input type="color" value={(config.color as string) ?? '#60a5fa'} onChange={(e) => update('color', e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={(config.showTrend as boolean) ?? false}
              onChange={(e) => update('showTrend', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-500" />
            <span className="text-xs text-gray-300">Show trend</span>
          </label>
        </div>
      );

    case 'button':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">On Value</label>
            <input type="text" value={(config.onValue as string) ?? '1'} onChange={(e) => update('onValue', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Off Value</label>
            <input type="text" value={(config.offValue as string) ?? '0'} onChange={(e) => update('offValue', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Color</label>
            <input type="color" value={(config.color as string) ?? '#3b82f6'} onChange={(e) => update('color', e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Mode</label>
            <select value={(config.mode as string) ?? 'push'} onChange={(e) => update('mode', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
              <option value="push">Push (hold)</option>
              <option value="toggle">Toggle (click)</option>
            </select>
          </div>
        </div>
      );

    case 'slider':
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Min</label>
              <input type="number" value={(config.min as number) ?? 0} onChange={(e) => update('min', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Max</label>
              <input type="number" value={(config.max as number) ?? 100} onChange={(e) => update('max', parseFloat(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Step</label>
            <input type="number" min={0.1} step={0.1} value={(config.step as number) ?? 1}
              onChange={(e) => update('step', parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Color</label>
            <input type="color" value={(config.color as string) ?? '#3b82f6'} onChange={(e) => update('color', e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
          </div>
        </div>
      );

    case 'gauge':
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Min</label>
              <input type="number" value={(config.min as number) ?? 0} onChange={(e) => update('min', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Max</label>
              <input type="number" value={(config.max as number) ?? 100} onChange={(e) => update('max', parseFloat(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Warning</label>
              <input type="number" value={(config.warningThreshold as number) ?? 70}
                onChange={(e) => update('warningThreshold', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Danger</label>
              <input type="number" value={(config.dangerThreshold as number) ?? 90}
                onChange={(e) => update('dangerThreshold', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Unit</label>
            <input type="text" value={(config.unit as string) ?? ''} onChange={(e) => update('unit', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" placeholder="e.g. °C" />
          </div>
        </div>
      );

    case 'line_chart':
    case 'area_chart':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time Range</label>
            <select value={(config.timeRange as string) ?? '1h'} onChange={(e) => update('timeRange', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white">
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Color</label>
            <input type="color" value={(config.color as string) ?? '#60a5fa'} onChange={(e) => update('color', e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-600" />
          </div>
          {type === 'area_chart' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fill Opacity</label>
              <input type="range" min={0} max={1} step={0.05} value={(config.fillOpacity as number) ?? 0.2}
                onChange={(e) => update('fillOpacity', parseFloat(e.target.value))}
                className="w-full accent-blue-500" />
              <span className="text-xs text-gray-500">{((config.fillOpacity as number) ?? 0.2).toFixed(2)}</span>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={(config.showDots as boolean) ?? false}
              onChange={(e) => update('showDots', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-500" />
            <span className="text-xs text-gray-300">Show data points</span>
          </label>
        </div>
      );

    default:
      return null;
  }
}

export default function WidgetPickerModal({ open, onClose, deviceId, onSubmit }: WidgetPickerModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [pins, setPins] = useState<VirtualPin[]>([]);
  const [loadingPins, setLoadingPins] = useState(false);
  const [isNewPin, setIsNewPin] = useState(false);
  const [showNewPinForm, setShowNewPinForm] = useState(false);
  const [newPinNumber, setNewPinNumber] = useState<number>(0);
  const [newPinLabel, setNewPinLabel] = useState('');
  const [newPinDirection, setNewPinDirection] = useState<VirtualPin['direction']>('read');
  const [newPinDataType, setNewPinDataType] = useState<VirtualPin['dataType']>('number');
  const [newPinUnit, setNewPinUnit] = useState('');
  const [newPinMin, setNewPinMin] = useState<number | undefined>(undefined);
  const [newPinMax, setNewPinMax] = useState<number | undefined>(undefined);
  const [creatingPin, setCreatingPin] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedType(null);
      setSelectedPin(null);
      setLabel('');
      setConfig({});
      setIsNewPin(false);
      setShowNewPinForm(false);
      setNewPinNumber(0);
      setNewPinLabel('');
      setNewPinDirection('read');
      setNewPinDataType('number');
      setNewPinUnit('');
      setNewPinMin(undefined);
      setNewPinMax(undefined);
    }
  }, [open]);

  useEffect(() => {
    if (step >= 2 && deviceId) {
      setLoadingPins(true);
      getPins(deviceId)
        .then((res) => {
          if (res.success && res.data) setPins(res.data.pins);
        })
        .catch(() => {/* silent */})
        .finally(() => setLoadingPins(false));
    }
  }, [step, deviceId]);

  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type);
    setConfig(defaultConfig(type));
    setStep(2);
  };

  const handleNext = () => {
    if (step === 2) {
      if (showNewPinForm) {
        setSelectedPin(newPinNumber);
        setIsNewPin(true);
      } else {
        setIsNewPin(false);
      }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!selectedType || selectedPin === null) return;

    if (isNewPin) {
      setCreatingPin(true);
      try {
        await upsertPin(deviceId, {
          pinNumber: selectedPin,
          label: newPinLabel || `Pin V${selectedPin}`,
          direction: newPinDirection,
          dataType: newPinDataType,
          unit: newPinUnit || undefined,
          minValue: newPinMin,
          maxValue: newPinMax,
        });
      } catch {
        toast.error('Failed to create pin');
        setCreatingPin(false);
        return;
      }
      setCreatingPin(false);
    }

    onSubmit({
      type: selectedType,
      pinNumber: selectedPin,
      label: label || `${selectedType.replace('_', ' ')} #${selectedPin}`,
      config,
    });
    onClose();
  };

  const canProceed =
    step === 1 ? !!selectedType
      : step === 2 ? (showNewPinForm ? newPinNumber >= 0 && newPinNumber <= 255 : selectedPin !== null)
        : true;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)} className="p-1 rounded-lg hover:bg-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <div>
              <h3 className="text-sm font-semibold text-white">
                {step === 1 ? 'Select Widget Type' : step === 2 ? 'Select Pin' : step === 3 ? 'Name Widget' : 'Configure Widget'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Step {step} of 4
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Select type */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {widgetTypes.map((wt) => {
                const Icon = wt.icon;
                return (
                  <button
                    key={wt.type}
                    onClick={() => handleSelectType(wt.type)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-700/50 bg-gray-700/30 hover:bg-gray-700 hover:border-gray-600 transition-all text-left"
                  >
                    <Icon className="w-8 h-8 text-blue-400" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-white">{wt.label}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{wt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Select pin */}
          {step === 2 && (
            <div>
              {loadingPins ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Existing pins */}
                  {pins.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Existing Pins</h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {pins.map((pin) => (
                          <label
                            key={pin.pinNumber}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                              selectedPin === pin.pinNumber && !showNewPinForm
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-700 bg-gray-700/30 hover:bg-gray-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="pin-select"
                              checked={selectedPin === pin.pinNumber && !showNewPinForm}
                              onChange={() => { setSelectedPin(pin.pinNumber); setShowNewPinForm(false); }}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedPin === pin.pinNumber && !showNewPinForm ? 'border-blue-500' : 'border-gray-500'
                            }`}>
                              {selectedPin === pin.pinNumber && !showNewPinForm && (
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-white">V{pin.pinNumber}</span>
                              <span className="text-xs text-gray-400 ml-2">{pin.label}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                              pin.direction === 'read' ? 'bg-green-500/20 text-green-400' :
                              pin.direction === 'write' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {pin.direction}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create New Pin */}
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowNewPinForm(!showNewPinForm)}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-gray-700/30 hover:bg-gray-700 transition-colors text-left"
                    >
                      <Plus className={`w-4 h-4 text-blue-400 transition-transform duration-200 ${showNewPinForm ? 'rotate-45' : ''}`} />
                      <span className="text-sm font-medium text-white">Create New Pin</span>
                    </button>
                    {showNewPinForm && (
                      <div className="p-4 border-t border-gray-700 space-y-3">
                        <div className="flex gap-3">
                          <div className="w-32 shrink-0">
                            <label className="block text-xs text-gray-400 mb-1">Pin Number</label>
                            <input
                              type="number"
                              min={0}
                              max={255}
                              value={newPinNumber}
                              onChange={(e) => setNewPinNumber(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Label</label>
                            <input
                              type="text"
                              value={newPinLabel}
                              onChange={(e) => setNewPinLabel(e.target.value)}
                              placeholder="e.g. Temperature Sensor"
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Direction</label>
                            <select
                              value={newPinDirection}
                              onChange={(e) => setNewPinDirection(e.target.value as VirtualPin['direction'])}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                            >
                              <option value="read">Read (ESP32 → Dashboard)</option>
                              <option value="write">Write (Dashboard → ESP32)</option>
                              <option value="readwrite">Read + Write</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Data Type</label>
                            <select
                              value={newPinDataType}
                              onChange={(e) => setNewPinDataType(e.target.value as VirtualPin['dataType'])}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                            >
                              <option value="number">Number</option>
                              <option value="string">String</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Unit <span className="text-gray-500">(optional)</span></label>
                          <input
                            type="text"
                            value={newPinUnit}
                            onChange={(e) => setNewPinUnit(e.target.value)}
                            placeholder="e.g. °C, %RH, hPa"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500"
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Min Value <span className="text-gray-500">(optional)</span></label>
                            <input
                              type="number"
                              value={newPinMin ?? ''}
                              onChange={(e) => setNewPinMin(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Max Value <span className="text-gray-500">(optional)</span></label>
                            <input
                              type="number"
                              value={newPinMax ?? ''}
                              onChange={(e) => setNewPinMax(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Name */}
          {step === 3 && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Widget Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={selectedType ? `${selectedType.replace('_', ' ')} #${selectedPin}` : ''}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave empty to use auto-generated name.
              </p>
            </div>
          )}

          {/* Step 4: Configure */}
          {step === 4 && selectedType && (
            <ConfigFields type={selectedType} config={config} onChange={setConfig} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-3 border-t border-gray-700 shrink-0">
          <span className="text-xs text-gray-500">
            {selectedType && selectedPin !== null
              ? `${widgetTypes.find((w) => w.type === selectedType)?.label} · V${selectedPin}`
              : ''}
          </span>
          <div className="flex gap-2">
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={creatingPin}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {creatingPin && <Loader2 className="w-4 h-4 animate-spin" />}
                {creatingPin ? 'Creating Pin...' : 'Add Widget'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
