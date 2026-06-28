import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GridLayout from 'react-grid-layout';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  Wifi,
  WifiOff,
  Trash2,
  Settings,
  Cpu,
  Key,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDevices, useDevice, useDeleteDevice } from '../hooks/useDevices';
import { useWidgets, useCreateWidget, useUpdateWidget, useDeleteWidget, useSaveLayout } from '../hooks/useWidgets';
import { usePins, useUpsertPin, useDeletePin } from '../hooks/useVirtualPin';
import WidgetWrapper from '../components/widgets/base/WidgetWrapper';
import WidgetPickerModal from '../components/grid/WidgetPickerModal';
import WidgetConfigModal from '../components/widgets/base/WidgetConfigModal';
import { writePin } from '../services/virtualpin.service';
import LineChartWidget from '../components/widgets/chart/LineChartWidget';
import AreaChartWidget from '../components/widgets/chart/AreaChartWidget';
import GaugeWidget from '../components/widgets/chart/GaugeWidget';
import type { Widget, WidgetType, VirtualPin } from '../types';
import type { CreateWidgetData } from '../services/widgets.service';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const WIDGET_DEFAULTS: Record<WidgetType, { w: number; h: number }> = {
  value_display: { w: 2, h: 2 },
  line_chart: { w: 4, h: 3 },
  area_chart: { w: 4, h: 3 },
  gauge: { w: 2, h: 3 },
  button: { w: 1, h: 1 },
  toggle: { w: 1, h: 1 },
  slider: { w: 3, h: 1 },
  led: { w: 1, h: 1 },
  label: { w: 2, h: 1 },
};

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deviceId = id!;

  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutateAsync: deleteDevice, isPending: isDeleting } = useDeleteDevice();
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  const { isConnected } = useWebSocket(deviceId);
  const { data: widgets, isLoading: widgetsLoading } = useWidgets(deviceId);
  const { mutateAsync: createWidget } = useCreateWidget(deviceId);
  const { mutateAsync: deleteWidget } = useDeleteWidget();
  const { mutateAsync: updateWidget } = useUpdateWidget();
  const { mutateAsync: saveLayout, isPending: isSavingLayout } = useSaveLayout(deviceId);
  const { data: pins } = usePins(deviceId);

  const { data: device, isLoading: deviceLoading } = useDevice(deviceId);

  const { mutateAsync: upsertPin, isPending: isUpsertingPin } = useUpsertPin();
  const { mutateAsync: deletePin, isPending: isDeletingPin } = useDeletePin();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const [showPinManager, setShowPinManager] = useState(false);
  const [pinManagerExpanded, setPinManagerExpanded] = useState(true);
  const [editingPinNumber, setEditingPinNumber] = useState<number | null>(null);
  const [pinForm, setPinForm] = useState({
    pinNumber: '',
    label: '',
    direction: 'read' as VirtualPin['direction'],
    dataType: 'number' as VirtualPin['dataType'],
    unit: '',
    minValue: '',
    maxValue: '',
  });

  const layouts = useMemo(
    () =>
      (widgets ?? []).map((w) => ({
        i: w.id,
        x: w.layout.x,
        y: w.layout.y,
        w: w.layout.w,
        h: w.layout.h,
        minW: 1,
        minH: 1,
      })),
    [widgets]
  );

  const handleLayoutChange = useCallback(
    (newLayout: GridLayout.Layout[]) => {
      if (!isEditMode || !widgets) return;
      const updated = widgets.map((w) => {
        const found = newLayout.find((l) => l.i === w.id);
        if (!found) return w;
        return {
          ...w,
          layout: { x: found.x, y: found.y, w: found.w, h: found.h },
        };
      });
      (async () => {
        await saveLayout(
          updated.map((w) => ({
            widgetId: w.id,
            x: w.layout.x,
            y: w.layout.y,
            w: w.layout.w,
            h: w.layout.h,
          }))
        );
      })();
    },
    [isEditMode, widgets, saveLayout]
  );

  const handleWritePin = useCallback(
    async (pinNumber: number, value: string) => {
      try {
        await writePin(deviceId, pinNumber, value);
      } catch {
        toast.error('Failed to send value to device');
      }
    },
    [deviceId]
  );

  const handleWidgetSubmit = useCallback(async (data: { type: WidgetType; pinNumber: number; label: string; config: Record<string, unknown> }) => {
    const defaults = WIDGET_DEFAULTS[data.type];
    const maxY = Math.max(0, ...(widgets ?? []).map((w) => w.layout.y + w.layout.h));
    try {
      await createWidget({
        ...data,
        layout: { x: 0, y: maxY, w: defaults.w, h: defaults.h },
      } as CreateWidgetData);
      toast.success('Widget added');
    } catch {
      toast.error('Failed to create widget');
    }
  }, [createWidget, widgets]);

  const handleEditWidget = useCallback((widgetId: string) => {
    const w = widgets?.find((w) => w.id === widgetId);
    if (w) setEditingWidget(w);
  }, [widgets]);

  const handleSaveConfig = useCallback(async (widgetId: string, label: string, config: Record<string, unknown>) => {
    try {
      await updateWidget({ deviceId, widgetId, data: { label, config } });
      toast.success('Widget updated');
    } catch {
      toast.error('Failed to update widget');
    }
  }, [updateWidget, deviceId]);

  const handleDeleteWidget = useCallback(
    async (widgetId: string) => {
      try {
        await deleteWidget({ deviceId, widgetId });
        toast.success('Widget deleted');
      } catch {
        toast.error('Failed to delete widget');
      }
    },
    [deleteWidget, deviceId]
  );

  const resetPinForm = useCallback(() => {
    setPinForm({ pinNumber: '', label: '', direction: 'read', dataType: 'number', unit: '', minValue: '', maxValue: '' });
    setEditingPinNumber(null);
  }, []);

  const handleEditPin = useCallback((pin: VirtualPin) => {
    setPinForm({
      pinNumber: String(pin.pinNumber),
      label: pin.label,
      direction: pin.direction,
      dataType: pin.dataType,
      unit: pin.unit ?? '',
      minValue: pin.minValue !== undefined ? String(pin.minValue) : '',
      maxValue: pin.maxValue !== undefined ? String(pin.maxValue) : '',
    });
    setEditingPinNumber(pin.pinNumber);
  }, []);

  const handleAddNewPin = useCallback(() => {
    resetPinForm();
  }, [resetPinForm]);

  const handleSavePin = useCallback(async () => {
    const pinNumber = Number(pinForm.pinNumber);
    if (isNaN(pinNumber) || pinNumber < 0 || pinNumber > 255) {
      toast.error('Pin number must be between 0 and 255');
      return;
    }
    try {
      await upsertPin({
        deviceId,
        data: {
          pinNumber,
          label: pinForm.label,
          direction: pinForm.direction,
          dataType: pinForm.dataType,
          unit: pinForm.unit || undefined,
          minValue: pinForm.minValue ? Number(pinForm.minValue) : undefined,
          maxValue: pinForm.maxValue ? Number(pinForm.maxValue) : undefined,
        },
      });
      resetPinForm();
    } catch {
      // handled by mutation onError
    }
  }, [pinForm, upsertPin, deviceId, resetPinForm]);

  const handleDeletePinAction = useCallback(
    async (pinNumber: number) => {
      try {
        await deletePin({ deviceId, pinNumber });
      } catch {
        // handled by mutation onError
      }
    },
    [deletePin, deviceId]
  );

  const openPinManager = useCallback(() => {
    setShowPinManager(true);
    resetPinForm();
  }, [resetPinForm]);

  const renderWidgetContent = (widget: Widget) => {
    const pin = pins?.find((p) => p.pinNumber === widget.pinNumber);

    switch (widget.type) {
      case 'value_display':
        return <ValueDisplayWidget widget={widget} pin={pin} deviceId={deviceId} />;
      case 'button':
        return <ButtonWidget widget={widget} pin={pin} deviceId={deviceId} onWrite={handleWritePin} />;
      case 'toggle':
        return <ToggleWidget widget={widget} pin={pin} deviceId={deviceId} onWrite={handleWritePin} />;
      case 'slider':
        return <SliderWidget widget={widget} pin={pin} deviceId={deviceId} onWrite={handleWritePin} />;
      case 'led':
        return <LedWidget widget={widget} pin={pin} deviceId={deviceId} />;
      case 'label':
        return <LabelWidget widget={widget} />;
      case 'line_chart':
        return <LineChartWidget widget={widget} />;
      case 'area_chart':
        return <AreaChartWidget widget={widget} />;
      case 'gauge':
        return <GaugeWidget widget={widget} />;
      default:
        return (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Unknown widget type
          </div>
        );
    }
  };

  useEffect(() => {
    if (!isEditMode && widgets && layouts.length > 0) {
      handleLayoutChange(layouts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  if (deviceLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/devices')}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {device?.name ?? 'Device'}
              </h1>
              {device && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    device.status === 'online'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {device.status === 'online' ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Wifi className="h-3 w-3" />
                {isConnected ? 'WS Connected' : 'WS Disconnected'}
              </span>
            </div>
            {device?.lastSeen && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last seen {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApiKey(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors"
            title="View API key"
          >
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Key</span>
          </button>
          <button
            onClick={openPinManager}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Pins</span>
          </button>
          <button
            onClick={() => setWidgetPickerOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-background px-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete device"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
              isEditMode
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border bg-background hover:bg-muted'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4" />
                View Mode
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      {widgetsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !widgets || widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-20">
          <Cpu className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No widgets yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add widgets to visualize your device data.
          </p>
          <button
            onClick={() => setWidgetPickerOpen(true)}
            className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </button>
        </div>
      ) : (
        <div className={isEditMode ? 'pointer-events-auto' : ''}>
          <GridLayout
            className="layout"
            layout={layouts}
            cols={12}
            rowHeight={80}
            width={1200}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            compactType="vertical"
            margin={[16, 16]}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetWrapper widget={widget} isEditMode={isEditMode} onDelete={handleDeleteWidget} onEdit={handleEditWidget}>
                  {isEditMode && (
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="absolute right-2 top-2 z-10 rounded-md bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="h-full w-full overflow-hidden">
                    {renderWidgetContent(widget)}
                  </div>
                </WidgetWrapper>
              </div>
            ))}
          </GridLayout>
        </div>
      )}

      <WidgetPickerModal
        open={widgetPickerOpen}
        onClose={() => setWidgetPickerOpen(false)}
        deviceId={deviceId}
        onSubmit={handleWidgetSubmit}
      />

      {editingWidget && (
        <WidgetConfigModal
          open={true}
          onClose={() => setEditingWidget(null)}
          widget={editingWidget}
          onSave={handleSaveConfig}
        />
      )}

      {/* API Key Modal */}
      {showApiKey && device && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">API Key</h2>
              <button
                onClick={() => setShowApiKey(false)}
                className="rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              This key authenticates your ESP32 with KuroHub.
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5">
              <code className="flex-1 text-sm font-mono break-all select-all">
                {apiKeyRevealed ? device.apiKey : `${device.apiKey.slice(0, 8)}••••••••••••`}
              </code>
              <button
                onClick={() => setApiKeyRevealed(!apiKeyRevealed)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"
                title={apiKeyRevealed ? 'Hide' : 'Show'}
              >
                {apiKeyRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(device.apiKey);
                  setKeyCopied(true);
                  setTimeout(() => setKeyCopied(false), 2000);
                }}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"
                title="Copy"
              >
                {keyCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => setShowApiKey(false)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-red-400">Delete Device?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete <strong>{device?.name}</strong> and all its widgets, pins, and data.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={async () => {
                  await deleteDevice(deviceId);
                  navigate('/devices');
                }}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pin Manager Modal */}
      {showPinManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold">Virtual Pins</h2>
              <button
                onClick={() => setShowPinManager(false)}
                className="rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pin list */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              {!pins || pins.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No virtual pins configured yet.
                </div>
              ) : (
                pins.map((pin) => (
                  <div
                    key={pin.pinNumber}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
                  >
                    <span className="text-xs font-mono font-bold text-primary w-10 shrink-0">
                      V{pin.pinNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pin.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {pin.direction} · {pin.dataType}
                        {pin.unit ? ` · ${pin.unit}` : ''}
                        {pin.minValue !== undefined && pin.maxValue !== undefined
                          ? ` · ${pin.minValue}–${pin.maxValue}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditPin(pin)}
                        className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePinAction(pin.pinNumber)}
                        disabled={isDeletingPin}
                        className="rounded-lg p-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Expand/collapse form */}
            <div className="mt-4 pt-4 border-t shrink-0">
              <button
                onClick={() => setPinManagerExpanded(!pinManagerExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {pinManagerExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {editingPinNumber !== null ? `Editing V${editingPinNumber}` : 'Add New Pin'}
              </button>

              {pinManagerExpanded && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Pin Number (0–255)</label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={pinForm.pinNumber}
                        onChange={(e) => setPinForm({ ...pinForm, pinNumber: e.target.value })}
                        disabled={editingPinNumber !== null}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Label</label>
                      <input
                        value={pinForm.label}
                        onChange={(e) => setPinForm({ ...pinForm, label: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Temperature"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Direction</label>
                      <select
                        value={pinForm.direction}
                        onChange={(e) => setPinForm({ ...pinForm, direction: e.target.value as VirtualPin['direction'] })}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="read">Read</option>
                        <option value="write">Write</option>
                        <option value="readwrite">Read/Write</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Data Type</label>
                      <select
                        value={pinForm.dataType}
                        onChange={(e) => setPinForm({ ...pinForm, dataType: e.target.value as VirtualPin['dataType'] })}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="number">Number</option>
                        <option value="string">String</option>
                        <option value="color">Color</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Unit</label>
                      <input
                        value={pinForm.unit}
                        onChange={(e) => setPinForm({ ...pinForm, unit: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="°C"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Min</label>
                      <input
                        type="number"
                        value={pinForm.minValue}
                        onChange={(e) => setPinForm({ ...pinForm, minValue: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Max</label>
                      <input
                        type="number"
                        value={pinForm.maxValue}
                        onChange={(e) => setPinForm({ ...pinForm, maxValue: e.target.value })}
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={resetPinForm}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePin}
                      disabled={isUpsertingPin || !pinForm.pinNumber || !pinForm.label}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isUpsertingPin && <Loader2 className="h-4 w-4 animate-spin" />}
                      {editingPinNumber !== null ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Inline Widget Renderers ─── */

import { usePinStore } from '../store/pinStore';

function ValueDisplayWidget({
  widget,
  pin,
  deviceId,
}: {
  widget: Widget;
  pin?: { unit?: string; dataType: string; minValue?: number; maxValue?: number };
  deviceId: string;
}) {
  const value = usePinStore((s) => s.pins[deviceId]?.[widget.pinNumber]);
  const precision = (widget.config as { precision?: number })?.precision ?? 2;

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <p className="text-xs font-medium text-muted-foreground truncate w-full text-center">
        {widget.label}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums">
        {value !== undefined ? Number(value).toFixed(precision) : '---'}
      </p>
      {pin?.unit && (
        <p className="text-xs text-muted-foreground mt-0.5">{pin.unit}</p>
      )}
    </div>
  );
}

function ButtonWidget({
  widget,
  deviceId,
  onWrite,
}: {
  widget: Widget;
  pin?: { pinNumber: number };
  deviceId: string;
  onWrite: (pin: number, value: string) => void;
}) {
  const config = widget.config as { onValue?: string; offValue?: string; mode?: 'push' | 'toggle'; color?: string };
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (config.mode === 'toggle') {
      const next = !pressed;
      setPressed(next);
      onWrite(widget.pinNumber, next ? (config.onValue ?? '1') : (config.offValue ?? '0'));
    } else {
      onWrite(widget.pinNumber, config.onValue ?? '1');
      setTimeout(() => onWrite(widget.pinNumber, config.offValue ?? '0'), 200);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-3">
      <button
        onClick={handleClick}
        className="h-full w-full rounded-lg font-medium text-sm transition-all active:scale-95"
        style={{
          backgroundColor: pressed ? 'hsl(var(--primary))' : (config.color ?? 'hsl(var(--secondary))'),
          color: pressed ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
        }}
      >
        {widget.label}
      </button>
    </div>
  );
}

function ToggleWidget({
  widget,
  deviceId,
  onWrite,
}: {
  widget: Widget;
  pin?: { pinNumber: number };
  deviceId: string;
  onWrite: (pin: number, value: string) => void;
}) {
  const value = usePinStore((s) => Number(s.pins[deviceId]?.[widget.pinNumber]) > 0);
  const [isOn, setIsOn] = useState(value);

  useEffect(() => {
    setIsOn(value);
  }, [value]);

  const handleToggle = () => {
    const next = !isOn;
    setIsOn(next);
    onWrite(widget.pinNumber, next ? '1' : '0');
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
      <p className="text-xs font-medium text-muted-foreground">{widget.label}</p>
      <button
        onClick={handleToggle}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          isOn ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <div
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            isOn ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function SliderWidget({
  widget,
  pin,
  deviceId,
  onWrite,
}: {
  widget: Widget;
  pin?: { minValue?: number; maxValue?: number; unit?: string };
  deviceId: string;
  onWrite: (pin: number, value: string) => void;
}) {
  const config = widget.config as { min?: number; max?: number; step?: number };
  const min = config.min ?? pin?.minValue ?? 0;
  const max = config.max ?? pin?.maxValue ?? 100;
  const step = config.step ?? 1;
  const [localValue, setLocalValue] = useState(min);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocalValue(v);
  };

  const handleCommit = () => {
    onWrite(widget.pinNumber, String(localValue));
  };

  return (
    <div className="flex h-full items-center gap-3 px-4">
      <p className="text-xs font-medium text-muted-foreground w-16 truncate">
        {widget.label}
      </p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="flex-1 h-2 cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
      />
      <span className="text-sm font-medium tabular-nums w-12 text-right">
        {localValue}
      </span>
    </div>
  );
}

function LedWidget({
  widget,
  deviceId,
}: {
  widget: Widget;
  pin?: { pinNumber: number };
  deviceId: string;
}) {
  const value = usePinStore((s) => Number(s.pins[deviceId]?.[widget.pinNumber]) > 0);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
      <p className="text-xs font-medium text-muted-foreground">{widget.label}</p>
      <div
        className={`h-5 w-5 rounded-full transition-shadow ${
          value ? 'bg-emerald-500 shadow-[0_0_12px_theme(colors.emerald.500)]' : 'bg-muted-foreground/30'
        }`}
      />
      <p className="text-xs font-medium">{value ? 'ON' : 'OFF'}</p>
    </div>
  );
}

function LabelWidget({ widget }: { widget: Widget }) {
  return (
    <div className="flex h-full items-center justify-center p-3">
      <p className="text-sm font-medium text-center">{widget.label}</p>
    </div>
  );
}


