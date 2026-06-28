# 🎨 BRIEF 03 — Frontend Developer Guide

---

## 1. Struktur Folder Frontend

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/                          # shadcn/ui (jangan edit)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── grid/
│   │   │   ├── DashboardGrid.tsx        # react-grid-layout wrapper
│   │   │   ├── GridToolbar.tsx          # tombol Add Widget, Edit mode toggle
│   │   │   └── WidgetPickerModal.tsx    # modal pilih tipe widget baru
│   │   └── widgets/
│   │       ├── base/
│   │       │   ├── WidgetWrapper.tsx    # container semua widget (drag handle, menu)
│   │       │   └── WidgetConfigModal.tsx # modal edit config widget
│   │       ├── display/
│   │       │   ├── ValueDisplayWidget.tsx
│   │       │   └── LEDWidget.tsx
│   │       ├── chart/
│   │       │   ├── LineChartWidget.tsx
│   │       │   ├── AreaChartWidget.tsx
│   │       │   └── GaugeWidget.tsx
│   │       └── control/
│   │           ├── ButtonWidget.tsx
│   │           ├── ToggleWidget.tsx
│   │           └── SliderWidget.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── DashboardPage.tsx            # /
│   │   ├── DevicesPage.tsx              # /devices
│   │   ├── DeviceDetailPage.tsx         # /devices/:id ← halaman widget grid
│   │   ├── HistoryPage.tsx              # /history
│   │   ├── AlertsPage.tsx               # /alerts
│   │   └── SettingsPage.tsx             # /settings
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useDevices.ts
│   │   ├── useWidgets.ts
│   │   ├── useVirtualPin.ts
│   │   └── useAlerts.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── devices.service.ts
│   │   ├── widgets.service.ts
│   │   └── virtualpin.service.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── pinStore.ts                  # live pin values dari WebSocket
│   └── types/
│       └── index.ts
└── ...
```

---

## 2. Routing

```tsx
<Routes>
  <Route element={<AuthLayout />}>
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/"                element={<DashboardPage />} />
      <Route path="/devices"         element={<DevicesPage />} />
      <Route path="/devices/:id"     element={<DeviceDetailPage />} />
      <Route path="/history"         element={<HistoryPage />} />
      <Route path="/alerts"          element={<AlertsPage />} />
      <Route path="/settings"        element={<SettingsPage />} />
    </Route>
  </Route>
</Routes>
```

---

## 3. Widget System

### 3.1 DeviceDetailPage — Halaman Utama Widget

Ini adalah halaman paling kompleks. Terdiri dari:

```
┌────────────────────────────────────────────────────────────┐
│  ESP32 Greenhouse ● Online  │  [+ Add Widget]  [✏ Edit]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐  ┌──────┐  ┌──────────────────────┐ │
│  │  📈 Grafik Suhu  │  │Gauge │  │   28.5°C             │ │
│  │  (drag handle)   │  │ pH   │  │   Suhu Ruangan ↑     │ │
│  │  [resize corner] │  │      │  └──────────────────────┘ │
│  │                  │  │      │  ┌──────────────────────┐ │
│  │                  │  │      │  │  ● RELAY 1    [OFF]  │ │
│  └──────────────────┘  └──────┘  └──────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐      │
│  │  ━━━━━━━━━━━━●━━━━━━━━━  Kecepatan Kipas  128  │      │
│  └─────────────────────────────────────────────────┘      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Ada dua mode:
- **View mode** — widget tidak bisa dipindah, tombol kontrol aktif (slider bisa digeser, button bisa diklik)
- **Edit mode** — widget bisa di-drag & resize, tombol kontrol dinonaktifkan sementara

---

### 3.2 DashboardGrid — react-grid-layout

```tsx
// components/grid/DashboardGrid.tsx
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardGridProps {
  widgets: Widget[];
  isEditMode: boolean;
  onLayoutChange: (layout: Layout[]) => void;
}

export function DashboardGrid({ widgets, isEditMode, onLayoutChange }: DashboardGridProps) {
  const layout: Layout[] = widgets.map(w => ({
    i: w.id,
    x: w.layout.x,
    y: w.layout.y,
    w: w.layout.w,
    h: w.layout.h,
    minW: WIDGET_MIN_SIZES[w.type].minW,
    minH: WIDGET_MIN_SIZES[w.type].minH,
    isDraggable: isEditMode,
    isResizable: isEditMode,
  }));

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={80}           // 1 grid unit = 80px tinggi
      width={containerWidth}
      margin={[12, 12]}
      containerPadding={[0, 0]}
      onLayoutChange={onLayoutChange}
      draggableHandle=".widget-drag-handle"   // hanya handle area yang bisa drag
      resizeHandles={['se']}                  // resize dari sudut kanan bawah
    >
      {widgets.map(widget => (
        <div key={widget.id}>
          <WidgetWrapper
            widget={widget}
            isEditMode={isEditMode}
          />
        </div>
      ))}
    </GridLayout>
  );
}

// Ukuran minimum per tipe widget
const WIDGET_MIN_SIZES: Record<WidgetType, { minW: number; minH: number }> = {
  value_display : { minW: 2, minH: 2 },
  line_chart    : { minW: 4, minH: 3 },
  area_chart    : { minW: 4, minH: 3 },
  gauge         : { minW: 2, minH: 2 },
  button        : { minW: 2, minH: 2 },
  toggle        : { minW: 2, minH: 2 },
  slider        : { minW: 3, minH: 2 },
  led           : { minW: 1, minH: 1 },
  label         : { minW: 1, minH: 1 },
};
```

#### Auto-save layout

```tsx
// hooks/useWidgets.ts
const saveLayout = useMutation({
  mutationFn: (layouts: LayoutItem[]) =>
    widgetsService.saveLayout(deviceId, layouts),
});

// Di DashboardGrid — debounce 500ms setelah drag/resize selesai
const handleLayoutChange = useDebouncedCallback((layout: Layout[]) => {
  saveLayout.mutate(
    layout.map(l => ({ widgetId: l.i, x: l.x, y: l.y, w: l.w, h: l.h }))
  );
}, 500);
```

---

### 3.3 WidgetWrapper — Container Universal

```tsx
// components/widgets/base/WidgetWrapper.tsx
interface WidgetWrapperProps {
  widget: Widget;
  isEditMode: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function WidgetWrapper({ widget, isEditMode, onDelete, onEdit }: WidgetWrapperProps) {
  return (
    <div className="relative h-full rounded-xl border border-border bg-card overflow-hidden">

      {/* Drag handle — hanya tampil di edit mode */}
      {isEditMode && (
        <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8
                        flex items-center px-3 gap-2 bg-muted/50 cursor-grab
                        active:cursor-grabbing z-10">
          <GripHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">{widget.label}</span>

          {/* Widget action menu */}
          <div className="ml-auto flex gap-1">
            <button onClick={() => onEdit(widget.id)}>
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(widget.id)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>
      )}

      {/* Widget content */}
      <div className={cn("h-full p-3", isEditMode && "pt-10 pointer-events-none")}>
        <WidgetRenderer widget={widget} />
      </div>

      {/* Resize indicator di sudut kanan bawah (edit mode) */}
      {isEditMode && (
        <div className="absolute bottom-1 right-1 opacity-30">
          <GripHorizontal className="w-3 h-3 rotate-45" />
        </div>
      )}
    </div>
  );
}

// Router ke komponen widget yang tepat
function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'value_display': return <ValueDisplayWidget widget={widget} />;
    case 'line_chart':    return <LineChartWidget widget={widget} />;
    case 'area_chart':    return <AreaChartWidget widget={widget} />;
    case 'gauge':         return <GaugeWidget widget={widget} />;
    case 'button':        return <ButtonWidget widget={widget} />;
    case 'toggle':        return <ToggleWidget widget={widget} />;
    case 'slider':        return <SliderWidget widget={widget} />;
    case 'led':           return <LEDWidget widget={widget} />;
    default:              return <div>Unknown widget</div>;
  }
}
```

---

### 3.4 Widget Components Detail

#### ValueDisplayWidget
```tsx
// Membaca dari pinStore (live) atau latest API
export function ValueDisplayWidget({ widget }: { widget: Widget }) {
  const liveValue = usePinStore(s => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const { data: latest } = useLatestPin(widget.deviceId, widget.pinNumber);

  const value = liveValue ?? latest?.value ?? '—';
  const pin = usePinConfig(widget.deviceId, widget.pinNumber);

  return (
    <div className="flex flex-col justify-center items-center h-full gap-1">
      <p className="text-xs text-muted-foreground">{widget.label}</p>
      <p className={cn("font-bold tabular-nums", widget.config.fontSize === 'xl'
        ? "text-4xl" : "text-2xl")}
        style={{ color: widget.config.color }}>
        {typeof value === 'number' ? value.toFixed(widget.config.precision ?? 1) : value}
        <span className="text-lg ml-1 font-normal text-muted-foreground">{pin?.unit}</span>
      </p>
      {widget.config.showTrend && <TrendIndicator deviceId={widget.deviceId} pin={widget.pinNumber} />}
    </div>
  );
}
```

#### ButtonWidget
```tsx
export function ButtonWidget({ widget }: { widget: Widget }) {
  const { sendPinWrite } = useWebSocket();
  const [isPressed, setIsPressed] = useState(false);
  const config = widget.config as ButtonConfig;

  const handlePress = () => {
    sendPinWrite(widget.deviceId, widget.pinNumber, config.onValue ?? '1');
    setIsPressed(true);
  };

  const handleRelease = () => {
    if (config.mode === 'push') {
      sendPinWrite(widget.deviceId, widget.pinNumber, config.offValue ?? '0');
      setIsPressed(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <p className="text-xs text-muted-foreground">{widget.label}</p>
      <button
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        className={cn(
          "w-16 h-16 rounded-full font-medium text-white transition-all",
          "active:scale-95 shadow-md",
          isPressed ? "brightness-75" : ""
        )}
        style={{ backgroundColor: config.color ?? '#6366f1' }}
      >
        {isPressed ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
```

#### ToggleWidget
```tsx
export function ToggleWidget({ widget }: { widget: Widget }) {
  const liveValue = usePinStore(s => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const { sendPinWrite } = useWebSocket();
  const config = widget.config as ToggleConfig;

  const isOn = liveValue === (config.onValue ?? '1');

  const handleToggle = () => {
    const nextValue = isOn ? (config.offValue ?? '0') : (config.onValue ?? '1');
    sendPinWrite(widget.deviceId, widget.pinNumber, nextValue);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <p className="text-xs text-muted-foreground">{widget.label}</p>
      <button onClick={handleToggle} className={cn(
        "relative w-16 h-8 rounded-full transition-colors duration-200",
        isOn ? "bg-green-500" : "bg-muted"
      )}>
        <span className={cn(
          "absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-200",
          isOn ? "left-9" : "left-1"
        )} />
      </button>
      <span className={cn("text-sm font-medium", isOn ? "text-green-500" : "text-muted-foreground")}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
```

#### SliderWidget
```tsx
export function SliderWidget({ widget }: { widget: Widget }) {
  const liveValue = usePinStore(s => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const { sendPinWrite } = useWebSocket();
  const config = widget.config as SliderConfig;

  const numValue = parseFloat(liveValue ?? String(config.min ?? 0));
  const [localValue, setLocalValue] = useState(numValue);

  // Sync dari live data saat tidak sedang digeser
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    if (!isDragging) setLocalValue(numValue);
  }, [numValue, isDragging]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocalValue(v);
    sendPinWrite(widget.deviceId, widget.pinNumber, String(v));
  };

  return (
    <div className="flex flex-col justify-center h-full gap-3 px-2">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{widget.label}</p>
        <p className="text-sm font-mono font-medium" style={{ color: config.color }}>
          {localValue}
        </p>
      </div>
      <input
        type="range"
        min={config.min ?? 0}
        max={config.max ?? 1023}
        step={config.step ?? 1}
        value={localValue}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onChange={handleChange}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
        style={{ accentColor: config.color }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{config.min ?? 0}</span>
        <span>{config.max ?? 1023}</span>
      </div>
    </div>
  );
}
```

#### GaugeWidget
```tsx
export function GaugeWidget({ widget }: { widget: Widget }) {
  const liveValue = usePinStore(s => s.pins[widget.deviceId]?.[widget.pinNumber]);
  const config = widget.config as GaugeConfig;
  const value = parseFloat(liveValue ?? '0');
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);

  // SVG arc gauge
  const angle = -135 + pct * 270;
  const color = value >= (config.dangerThreshold ?? 90)  ? '#ef4444'
              : value >= (config.warningThreshold ?? 70) ? '#f59e0b'
              : '#6366f1';

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-xs text-muted-foreground mb-2">{widget.label}</p>
      <GaugeSVG value={value} pct={pct} color={color} unit={config.unit ?? ''} />
    </div>
  );
}
```

---

### 3.5 Widget Picker Modal

Modal yang muncul saat user klik **+ Add Widget**:

```tsx
// components/grid/WidgetPickerModal.tsx

const WIDGET_TYPES = [
  { type: 'value_display', label: 'Value Display', icon: Hash,       description: 'Tampilkan nilai numerik atau teks dari pin' },
  { type: 'line_chart',    label: 'Line Chart',    icon: TrendingUp, description: 'Grafik garis historis & real-time' },
  { type: 'area_chart',    label: 'Area Chart',    icon: AreaChart,  description: 'Grafik area dengan fill' },
  { type: 'gauge',         label: 'Gauge',         icon: Gauge,      description: 'Indikator circular dengan threshold' },
  { type: 'button',        label: 'Button',        icon: MousePointer, description: 'Kirim nilai saat diklik (push/toggle mode)' },
  { type: 'toggle',        label: 'Toggle Switch', icon: ToggleLeft, description: 'Switch ON/OFF persistent' },
  { type: 'slider',        label: 'Slider',        icon: SlidersHorizontal, description: 'Kirim nilai numerik dalam range' },
  { type: 'led',           label: 'LED Indicator', icon: Circle,     description: 'Indikator status on/off' },
];

// Flow:
// 1. User pilih tipe widget
// 2. Pilih virtual pin (dropdown dari GET /api/devices/:id/pins)
// 3. Isi label
// 4. Konfigurasi widget-specific (warna, range, dll)
// 5. Submit → POST /api/devices/:id/widgets
// 6. Widget muncul di grid (pojok kiri atas, posisi default)
```

---

## 4. State Management

### pinStore (Zustand)

```typescript
// store/pinStore.ts
interface PinStore {
  // Struktur: { [deviceId]: { [pinNumber]: lastValue } }
  pins: Record<string, Record<number, string>>;
  setPinValue: (deviceId: string, pin: number, value: string) => void;
  setDeviceStatus: (deviceId: string, status: 'online' | 'offline') => void;
  deviceStatus: Record<string, 'online' | 'offline'>;
}

export const usePinStore = create<PinStore>((set) => ({
  pins: {},
  deviceStatus: {},
  setPinValue: (deviceId, pin, value) =>
    set(state => ({
      pins: {
        ...state.pins,
        [deviceId]: { ...state.pins[deviceId], [pin]: value },
      },
    })),
  setDeviceStatus: (deviceId, status) =>
    set(state => ({ deviceStatus: { ...state.deviceStatus, [deviceId]: status } })),
}));
```

### WebSocket Hook

```typescript
// hooks/useWebSocket.ts
export function useWebSocket() {
  const { accessToken } = useAuthStore();
  const { setPinValue, setDeviceStatus } = usePinStore();
  const wsRef = useRef<WebSocket | null>(null);

  // Kirim nilai pin dari widget control (button, slider, toggle)
  const sendPinWrite = useCallback((deviceId: string, pin: number, value: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'pin_write',
        device_id: deviceId,
        pin,
        value,
      }));
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/dashboard`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token: accessToken }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'pin_update') {
        setPinValue(msg.device_id, msg.pin, msg.value);
      }
      if (msg.type === 'device_status') {
        setDeviceStatus(msg.device_id, msg.status);
      }
      if (msg.type === 'alert_triggered') {
        toast.warning(`⚠️ ${msg.message}`, { duration: 5000 });
      }
    };

    ws.onclose = () => setTimeout(() => { /* reconnect */ }, 3000);
    return () => ws.close();
  }, [accessToken]);

  return { sendPinWrite };
}
```

---

## 5. Chart Widget — Data Fetching

```typescript
// LineChartWidget data strategy:
// - Historical data: TanStack Query → GET /api/devices/:id/pins/:pin/history
// - Live data: append dari wsStore (pinStore) saat ada update baru
// - Chart simpan buffer max 200 data points di state lokal

export function LineChartWidget({ widget }: { widget: Widget }) {
  const config = widget.config as ChartConfig;
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  // Fetch historical data
  const { data: history } = useQuery({
    queryKey: ['pin-history', widget.deviceId, widget.pinNumber, config.timeRange],
    queryFn: () => virtualpinService.getHistory(widget.deviceId, widget.pinNumber, {
      from: subHours(new Date(), parseTimeRange(config.timeRange ?? '1h')),
      resolution: '1m',
    }),
  });

  useEffect(() => {
    if (history) setChartData(history.points);
  }, [history]);

  // Subscribe live update dari pinStore
  const liveValue = usePinStore(s => s.pins[widget.deviceId]?.[widget.pinNumber]);
  useEffect(() => {
    if (liveValue === undefined) return;
    setChartData(prev => [
      ...prev.slice(-199),  // max 200 points
      { timestamp: new Date().toISOString(), value: parseFloat(liveValue) },
    ]);
  }, [liveValue]);

  return (
    <div className="h-full flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{widget.label}</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="timestamp" tickFormatter={formatChartTime} />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color ?? '#6366f1'}
            dot={config.showDots ?? false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 6. TypeScript Types

```typescript
// types/index.ts

export type WidgetType =
  | 'value_display' | 'line_chart' | 'area_chart'
  | 'gauge' | 'button' | 'toggle' | 'slider' | 'led' | 'label';

export interface Widget {
  id: string;
  deviceId: string;
  type: WidgetType;
  pinNumber: number;
  label: string;
  config: Record<string, unknown>;
  layout: { x: number; y: number; w: number; h: number };
  createdAt: string;
}

export interface VirtualPin {
  id: string;
  deviceId: string;
  pinNumber: number;
  label: string;
  direction: 'read' | 'write' | 'readwrite';
  dataType: 'number' | 'string' | 'color';
  unit: string;
  minValue: number;
  maxValue: number;
  lastValue: string | null;
  lastUpdated: string | null;
}

// Config types per widget
export interface ButtonConfig {
  onValue: string;
  offValue: string;
  color: string;
  mode: 'push' | 'toggle';
}
export interface SliderConfig { min: number; max: number; step: number; color: string; }
export interface GaugeConfig  { min: number; max: number; warningThreshold: number; dangerThreshold: number; unit: string; }
export interface ChartConfig  { timeRange: string; color: string; fillOpacity: number; showDots: boolean; }
export interface ValueDisplayConfig { precision: number; fontSize: 'sm'|'md'|'xl'; color: string; showTrend: boolean; }
```

---

## 7. Dependencies Frontend

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.7",
    "react-grid-layout": "^1.4.4",
    "recharts": "^2.10.0",
    "lucide-react": "^0.309.0",
    "date-fns": "^3.2.0",
    "sonner": "^1.3.1",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "use-debounce": "^10.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "@types/react-grid-layout": "^1.3.5"
  }
}
```
