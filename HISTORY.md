# KuroHub — Project History

[2026-06-27 14:00] — Initial project setup: semua brief + AGENTS.md dibaca
Status: ✅ Selesai
File:
- README.md — dibaca
- BRIEF_01_ARCHITECTURE.md — dibaca
- BRIEF_02_BACKEND.md — dibaca
- BRIEF_03_FRONTEND.md — dibaca
- BRIEF_04_DEVOPS.md — dibaca
- BRIEF_05_ESP32_LIBRARY.md — dibaca
- AGENTS.md — dibaca

[2026-06-27 14:15] — Step 1: PostgreSQL migrations
Status: ✅ Selesai
File:
- backend/src/db/migrations/001_users.sql — dibuat — users + refresh_tokens tables
- backend/src/db/migrations/002_devices.sql — dibuat — devices table
- backend/src/db/migrations/003_virtual_pins.sql — dibuat — virtual_pins table
- backend/src/db/migrations/004_widgets.sql — dibuat — widgets table with JSONB config
- backend/src/db/migrations/005_alerts.sql — dibuat — alert_rules + alert_history tables

[2026-06-27 14:30] — Step 2-6: Backend full implementation
Status: ✅ Selesai
File:
- backend/package.json — dibuat — dependencies + scripts
- backend/tsconfig.json — dibuat — strict TypeScript config
- backend/src/config/env.ts — dibuat — env vars loader
- backend/src/config/logger.ts — dibuat — Winston logger
- backend/src/db/postgres.ts — dibuat — pg Pool + query helper
- backend/src/db/influx.ts — dibuat — InfluxDB client
- backend/src/db/migrate.ts — dibuat — SQL migration runner
- backend/src/types/index.ts — dibuat — semua TypeScript types
- backend/src/middleware/auth.ts — dibuat — JWT auth middleware
- backend/src/middleware/rateLimiter.ts — dibuat — rate limiter
- backend/src/middleware/validate.ts — dibuat — Zod validation middleware
- backend/src/middleware/errorHandler.ts — dibuat — global error handler
- backend/src/api/auth/auth.{routes,controller,service,schema}.ts — dibuat — auth module
- backend/src/api/devices/devices.{routes,controller,service,schema}.ts — dibuat — device CRUD
- backend/src/api/virtualpin/virtualpin.{routes,controller,service,schema}.ts — dibuat — virtual pin CRUD
- backend/src/api/widgets/widgets.{routes,controller,service,schema}.ts — dibuat — widget CRUD
- backend/src/api/alerts/alerts.{routes,controller,service,schema}.ts — dibuat — alerts module
- backend/src/ws/wsServer.ts — dibuat — WebSocket server setup
- backend/src/ws/deviceHandler.ts — dibuat — ESP32 connection handler
- backend/src/ws/dashboardHandler.ts — dibuat — Browser connection handler
- backend/src/ws/pinBroker.ts — dibuat — Central pin routing engine
- backend/src/services/alertEngine.ts — dibuat — Alert evaluation engine
- backend/src/index.ts — dibuat — Main entry point

[2026-06-27 15:00] — Step 7-15: Frontend full implementation
Status: ✅ Selesai
File:
- frontend/package.json — dibuat — dependencies
- frontend/tsconfig.json — dibuat — TypeScript config
- frontend/vite.config.ts — dibuat — Vite + React + path alias
- frontend/tailwind.config.js — dibuat — Tailwind with CSS variables
- frontend/postcss.config.js — dibuat — PostCSS config
- frontend/index.html — dibuat — HTML entry
- frontend/src/index.css — dibuat — Global styles + CSS variables + dark mode
- frontend/src/main.tsx — dibuat — React entry point
- frontend/src/App.tsx — dibuat — Router + ProtectedRoute
- frontend/src/vite-env.d.ts — dibuat — Env type declarations
- frontend/src/lib/utils.ts — dibuat — cn utility
- frontend/src/types/index.ts — dibuat — All frontend types
- frontend/src/services/api.ts — dibuat — Axios instance + interceptors
- frontend/src/services/auth.service.ts — dibuat — Auth API calls
- frontend/src/services/devices.service.ts — dibuat — Device API calls
- frontend/src/services/widgets.service.ts — dibuat — Widget API calls
- frontend/src/services/virtualpin.service.ts — dibuat — Virtual pin API calls
- frontend/src/services/alert.service.ts — dibuat — Alert API calls
- frontend/src/store/authStore.ts — dibuat — Zustand auth store
- frontend/src/store/pinStore.ts — dibuat — Zustand pin store
- frontend/src/hooks/useAuth.ts — dibuat — Auth hook
- frontend/src/hooks/useWebSocket.ts — dibuat — WebSocket hook
- frontend/src/hooks/useDevices.ts — dibuat — Devices query hooks
- frontend/src/hooks/useWidgets.ts — dibuat — Widgets query hooks
- frontend/src/hooks/useVirtualPin.ts — dibuat — Virtual pin query hooks
- frontend/src/hooks/useAlerts.ts — dibuat — Alerts query hooks
- frontend/src/components/layout/AppLayout.tsx — dibuat — Layout with sidebar
- frontend/src/components/layout/AuthLayout.tsx — dibuat — Auth layout
- frontend/src/components/layout/Sidebar.tsx — dibuat — Sidebar component
- frontend/src/components/layout/Topbar.tsx — dibuat — Top bar component
- frontend/src/components/grid/DashboardGrid.tsx — dibuat — react-grid-layout wrapper
- frontend/src/components/grid/GridToolbar.tsx — dibuat — Edit/View toolbar
- frontend/src/components/grid/WidgetPickerModal.tsx — dibuat — Add widget wizard
- frontend/src/components/widgets/base/WidgetWrapper.tsx — dibuat — Widget container
- frontend/src/components/widgets/base/WidgetConfigModal.tsx — dibuat — Config editor
- frontend/src/components/widgets/display/ValueDisplayWidget.tsx — dibuat — Value display
- frontend/src/components/widgets/display/LEDWidget.tsx — dibuat — LED indicator
- frontend/src/components/widgets/chart/LineChartWidget.tsx — dibuat — Line chart
- frontend/src/components/widgets/chart/AreaChartWidget.tsx — dibuat — Area chart
- frontend/src/components/widgets/chart/GaugeWidget.tsx — dibuat — SVG gauge
- frontend/src/components/widgets/control/ButtonWidget.tsx — dibuat — Push/toggle button
- frontend/src/components/widgets/control/ToggleWidget.tsx — dibuat — Toggle switch
- frontend/src/components/widgets/control/SliderWidget.tsx — dibuat — Range slider
- frontend/src/pages/auth/LoginPage.tsx — dibuat — Login page
- frontend/src/pages/auth/RegisterPage.tsx — dibuat — Register page
- frontend/src/pages/DashboardPage.tsx — dibuat — Dashboard overview
- frontend/src/pages/DevicesPage.tsx — dibuat — Device list
- frontend/src/pages/DeviceDetailPage.tsx — dibuat — Device detail + widget grid
- frontend/src/pages/HistoryPage.tsx — dibuat — Historical data viewer
- frontend/src/pages/AlertsPage.tsx — dibuat — Alert management
- frontend/src/pages/SettingsPage.tsx — dibuat — User settings

[2026-06-27 15:30] — Step 16: ESP32 Library
Status: ✅ Selesai
File:
- esp32-library/src/KuroHubPin.h — dibuat — Virtual pin constants
- esp32-library/src/KuroHub.h — dibuat — Library header
- esp32-library/src/KuroHub.cpp — dibuat — Library implementation
- esp32-library/library.properties — dibuat — Arduino metadata
- esp32-library/README.md — dibuat — Library docs
- esp32-library/examples/01_BasicConnect/01_BasicConnect.ino — dibuat
- esp32-library/examples/02_VirtualPinRead/02_VirtualPinRead.ino — dibuat
- esp32-library/examples/03_ButtonControl/03_ButtonControl.ino — dibuat
- esp32-library/examples/04_SliderControl/04_SliderControl.ino — dibuat
- esp32-library/examples/05_ToggleRelay/05_ToggleRelay.ino — dibuat
- esp32-library/examples/06_MultiSensor/06_MultiSensor.ino — dibuat
- esp32-library/examples/07_SyncOnConnect/07_SyncOnConnect.ino — dibuat

[2026-06-27 15:45] — Step 17: Docker + Nginx
Status: ✅ Selesai
File:
- docker/docker-compose.yml — dibuat — 5 services
- nginx/nginx.conf — dibuat — Production config
- nginx/nginx.dev.conf — dibuat — Dev config
- nginx/certs/ — dibuat — SSL certs directory
- frontend/Dockerfile — dibuat — Multi-stage build
- frontend/nginx.spa.conf — dibuat — SPA serving config
- backend/Dockerfile — dibuat — Multi-stage build
- .env.example — dibuat — Environment template

[2026-06-27 16:00] — Step 18: Final verification
Status: ⚠️ Partial
File:
- HISTORY.md — dibuat — Project history log

[2026-06-27 16:30] — Fix TypeScript compilation errors backend + frontend
Status: ✅ Selesai
File:
- backend/src/types/index.ts — diubah — all types to camelCase (Device, VirtualPin, Widget, AlertRule, AlertHistory, User)
- backend/src/middleware/auth.ts — diubah — add validatedBody to Request type
- backend/src/middleware/validate.ts — diubah — set validatedBody after parse
- backend/src/api/auth/auth.controller.ts — diubah — fix extractRefreshCookie signature, req.userId!
- backend/src/api/auth/auth.service.ts — diubah — fix jwt sign options
- backend/src/api/devices/devices.controller.ts — diubah — req.userId!, device.apiKey
- backend/src/api/devices/devices.service.ts — diubah — mapDevice camelCase
- backend/src/api/alerts/alerts.controller.ts — diubah — req.userId!
- backend/src/api/widgets/widgets.controller.ts — diubah — req.userId!
- backend/src/api/virtualpin/virtualpin.service.ts — diubah — flux query to collectRows
- backend/src/services/alertEngine.ts — diubah — pinNumber, deviceId camelCase
- backend/src/ws/deviceHandler.ts — diubah — device.userId camelCase
- backend/Dockerfile — diubah — fix migrations path
- docker/docker-compose.yml — diubah — remove version field, nginx config fix

[2026-06-27 17:00] — Fix all TypeScript compilation errors di frontend
Status: ✅ Selesai
File:
- components/widgets/chart/AreaChartWidget.tsx — diubah — cast config as unknown as ChartConfig
- components/widgets/chart/GaugeWidget.tsx — diubah — cast config as unknown as GaugeConfigWithDefaults
- components/widgets/chart/LineChartWidget.tsx — diubah — cast config as unknown as ChartConfig
- components/widgets/control/ButtonWidget.tsx — diubah — cast config as unknown as ButtonConfig
- components/widgets/control/SliderWidget.tsx — diubah — cast config as unknown as SliderConfig
- components/widgets/display/ValueDisplayWidget.tsx — diubah — cast config as unknown as ValueDisplayConfig
- hooks/useAuth.ts — diubah — fixed import ke * as authService, guard res.data, fixed profile.data
- hooks/useAlerts.ts — diubah — refactor return combined object (alerts, history, mutations)
- hooks/useWebSocket.ts — diubah — added isConnected state, optional deviceId auto-subscribe
- pages/AlertsPage.tsx — diubah — fixed import usePins path, updateAlert signature, toggleAlert
- pages/DevicesPage.tsx — diubah — added useCreateDevice, fixed destructuring
- pages/DeviceDetailPage.tsx — diubah — fixed imports, hooks, WidgetWrapper props, LedWidget deviceId
- pages/HistoryPage.tsx — diubah — fixed usePins import path
- pages/SettingsPage.tsx — diubah — fixed Intl.supportedValuesOf type, fixed tz parameter
- components/widgets/base/WidgetWrapper.tsx — diubah — added children prop, optional onDelete/onEdit

[2026-06-27 17:30] — Docker compose full stack berhasil
Status: ✅ Selesai
File:
- nginx/nginx.conf — diubah — combined dev+prod single config (no SSL, port 80)
- docker/docker-compose.yml — diubah — removed deprecated version field, nginx config path

[2026-06-27 18:00] — Fix runtime error t.filter is not a function + favicon 404
Status: ✅ Selesai
File:
- frontend/src/hooks/useDevices.ts — diubah — select: res.data?.devices ?? []
- frontend/src/hooks/useWidgets.ts — diubah — select: res.data?.widgets ?? []
- frontend/src/hooks/useVirtualPin.ts — diubah — select: res.data?.pins ?? []
- frontend/src/hooks/useAlerts.ts — diubah — select: res.data?.rules ?? []
- frontend/src/services/devices.service.ts — diubah — typed as ApiResponse<{devices: Device[]}>
- frontend/src/services/widgets.service.ts — diubah — typed as ApiResponse<{widgets: Widget[]}>
- frontend/src/services/virtualpin.service.ts — diubah — typed as ApiResponse<{pins: VirtualPin[]}>
- frontend/src/services/alert.service.ts — diubah — typed as ApiResponse<{rules: AlertRule[]}>
- frontend/src/pages/DeviceDetailPage.tsx — diubah — useDevice hook instead of raw useQuery
- frontend/src/components/grid/WidgetPickerModal.tsx — diubah — res.data.pins
- frontend/tsconfig.json — diubah — noImplicitAny: false
- frontend/index.html — diubah — inline emoji favicon instead of vite.svg
File yang diverifikasi:
- curl POST /api/auth/register → success: true, user created ✅
- Frontend http://localhost → HTTP 200, no JS runtime errors ✅

[2026-06-27 18:10] — Fix API key column length (500 on device create)
Status: ✅ Selesai
File:
- backend/src/db/migrations/002_devices.sql — diubah — VARCHAR(64) → VARCHAR(128)
- DB: ALTER TABLE devices ALTER COLUMN api_key TYPE VARCHAR(128)
File yang diverifikasi:
- POST /api/devices → success: true, device created with apiKey ✅

[2026-06-27 18:20] — Fix WebSocket (502), virtual pin (500), API key display, pin management UI
Status: ✅ Selesai
File:
- backend/src/api/virtualpin/virtualpin.routes.ts — diubah — mergeParams: true
- backend/src/api/widgets/widgets.routes.ts — diubah — mergeParams: true
- nginx/nginx.conf — diubah — backend_ws upstream ke port 3000 (bukan 3001)
- frontend/src/pages/DevicesPage.tsx — diubah — tampilkan API key modal setelah create device
- frontend/src/pages/DeviceDetailPage.tsx — diubah — tambah API Key viewer + Pin management modal
- frontend/src/hooks/useVirtualPin.ts — diubah — tambah useDeletePin hook
- frontend/src/services/devices.service.ts — diubah — createDevice return type include apiKey
File yang diverifikasi:
- POST /api/devices/:id/pins → 201, pin created ✅
- GET /api/devices/:id/pins → 200, pins listed ✅
- POST /api/devices/:id/widgets → 201, widget created ✅
- WS /ws/dashboard → 101 Switching Protocols ✅
- Frontend API Key modal muncul setelah create device ✅
- Frontend Pin management untuk create/edit/delete pin ✅

[2026-06-27 18:30] — Fix widget type schema (led vs led_indicator) + inline pin creation
Status: ✅ Selesai
File:
- backend/src/api/widgets/widgets.schema.ts — diubah — led_indicator → led
- frontend/src/components/grid/WidgetPickerModal.tsx — diubah — inline pin creation di step 2
File yang diverifikasi:
- POST /api/devices/:id/widgets type=led → 201 ✅
- WidgetPickerModal sekarang bisa create pin langsung tanpa keluar modal ✅

[2026-06-27 19:00] — Ganti ChartPlaceholder/GaugePlaceholder → komponen chart asli
Status: ✅ Selesai
File:
- frontend/src/pages/DeviceDetailPage.tsx — diubah — import LineChartWidget, AreaChartWidget, GaugeWidget; ganti placeholder di renderWidgetContent; hapus inline placeholder functions
File yang diverifikasi:
- docker build frontend → success ✅
- HTTP 200 ✅

[2026-06-27 19:15] — Fix layout save 400 + tambah delete device
Status: ✅ Selesai
File:
- frontend/src/pages/DeviceDetailPage.tsx — diubah — layout item i → widgetId, tambah tombol delete device + konfirmasi modal
- frontend/src/services/widgets.service.ts — diubah — LayoutItem i → widgetId
File yang diverifikasi:
- docker build frontend → success ✅

[2026-06-27 18:45] — Fix widget add 400 + Cannot read properties of undefined (reading 'x')
Status: ✅ Selesai
File:
- frontend/src/pages/DeviceDetailPage.tsx — diubah — ganti inline add widget modal dengan WidgetPickerModal, fix layout.y Infinity
- frontend/src/hooks/useWidgets.ts — diubah — mapWidget transform gridX/gridY/gridW/gridH ke layout.x/y/w/h
File yang diverifikasi:
- Build docker frontend → success ✅
- Frontend http://localhost → 200 ✅

[2026-06-27 19:00] — Tambah Python dummy ESP32 simulator
Status: ✅ Selesai
File:
- esp32-library/examples/python_dummy/esp32_simulator.py — dibuat — Full ESP32 simulator with WS, sensor loop, callbacks
- esp32-library/examples/python_dummy/quick_test.py — dibuat — One-shot test kirim data sensor
- esp32-library/examples/python_dummy/requirements.txt — dibuat — websocket-client dependency
Status: ✅ Selesai
File:
- frontend/src/pages/DeviceDetailPage.tsx — diubah — ganti inline add widget modal dengan WidgetPickerModal, fix layout.y Infinity
File yang diverifikasi:
- Build docker frontend → success ✅
- Frontend http://localhost → 200 ✅
- All 5 containers running healthy ✅
- Frontend http://localhost → HTTP 200
- API /api/health → status: ok
- DB /api/health/db → postgres: ok, influx: ok
- WS /api/health/ws → device_connections: 0, dashboard_connections: 0
- docker ps → 5 container running (nginx, frontend, backend, postgres, influxdb)

[2026-06-27 18:30] — Issue 1: API key modal after device creation + Issue 2: Virtual pin management on DeviceDetailPage
Status: ✅ Selesai
File:
- frontend/src/services/devices.service.ts — diubah — createDevice return type includes apiKey field
- frontend/src/hooks/useDevices.ts — diubah — remove toast from useCreateDevice onSuccess (replaced by API key modal)
- frontend/src/hooks/useVirtualPin.ts — diubah — added useDeletePin mutation hook
- frontend/src/pages/DevicesPage.tsx — diubah — handleCreate now captures apiKey from response; added API key overlay modal with copy button + warning + regen note
- frontend/src/pages/DeviceDetailPage.tsx — diubah — toolbar now has API Key (obscured with show/hide toggle + copy) and Pins buttons; added Pin Management modal (list, create, edit, delete virtual pins with full form)

[2026-06-27 18:40] — Inline pin creation in WidgetPickerModal
Status: ✅ Selesai
File:
- frontend/src/components/grid/WidgetPickerModal.tsx — diubah — step 2 now includes "Create New Pin" expandable section with inline form (pin number, label, direction, data type, unit, min, max); existing pins shown as radio buttons; on final submit with new pin, calls upsertPin API before creating widget

[2026-06-28 17:10] — Fix deployment failure: docker-compose.yml path & .env variables not found
Status: ✅ Selesai
File:
- docker-compose.yml (root) — dibuat — pindah dari docker/docker-compose.yml, perbaiki relative paths untuk root
- docker/docker-compose.yml — dipindah — backup ke docker/docker-compose.yml.bak
- backend/.dockerignore — dibuat — exclude node_modules, dist, .git dari build context
- frontend/.dockerignore — dibuat — exclude node_modules, dist, .git dari build context
- nginx/nginx.dev.conf — diubah — WS proxy port 3001 → 3000 (WS terattach di HTTP server port 3000)
File yang diverifikasi:
- docker compose up --build -d (dari root) → semua 5 container running ✅
- /api/health → status: ok ✅
- /api/health/db → postgres: ok, influx: ok ✅
- GET / (frontend) → HTTP 200 ✅

[2026-06-28 17:20] — Rebrand warna: biru dongker + kuning keemasan (gradien)
Status: ✅ Selesai
File:
- frontend/src/index.css — diubah — dark mode: bg 222 25% 6%, primary 222 80% 50% (biru dongker), accent 42 90% 55% (kuning keemasan); light mode: primary 222 75% 40%
- frontend/src/components/layout/AppLayout.tsx — diubah — sidebar header gradien biru→gold, active nav golden accent border, avatar gradien
- frontend/src/components/layout/Sidebar.tsx — diubah — sync dengan AppLayout (header gradien, active nav, avatar gradien)
- frontend/src/components/layout/AuthLayout.tsx — diubah — logo gradien, title gradient text
- frontend/src/components/grid/WidgetPickerModal.tsx — diubah — purple badge → amber (readwrite direction)
File yang diverifikasi:
- docker build frontend → success ✅
- GET / → HTTP 200 ✅
- CSS mengandung 222 80% 50% (biru) dan 42 90% 55% (emas) ✅

[2026-06-28 17:40] — Fix token refresh bug (500 error) + UI redesign profesional
Status: ✅ Selesai
File:
- backend/src/api/auth/auth.controller.ts — diubah — extractRefreshCookie tidak lagi send response premature; null handling dipindah ke refresh()
- frontend/src/index.css — diubah — color scheme dark slate (222 35% 7%) + gold primary (42 95% 55%) + deep blue accent (222 70% 45%)
- frontend/src/pages/DashboardPage.tsx — diubah — border-left accent cards, stat bars, activity list profesional
- frontend/src/pages/DevicesPage.tsx — diubah — search bar, card hover effects, modals lebih clean
- frontend/src/pages/DeviceDetailPage.tsx — diubah — drag handle icons, modals backdrop-blur, rounded-2xl
- frontend/src/pages/HistoryPage.tsx — diubah — filter icons, chart tooltip shadow, empty states
- frontend/src/pages/AlertsPage.tsx — diubah — table styling, uppercase headers, badge chips
- frontend/src/pages/SettingsPage.tsx — diubah — section icons, theme toggle, rounded-2xl
- frontend/src/pages/auth/LoginPage.tsx — diubah — gradient icon, card form, professional layout
- frontend/src/pages/auth/RegisterPage.tsx — diubah — gradient icon, error alert, professional layout
File yang diverifikasi:
- docker build frontend → success ✅
- docker compose up -d → 5 containers running ✅
- GET / → HTTP 200 ✅
- GET /api/health → status: ok ✅
- CSS mengandung slate bg (222 35% 7%), gold primary (42 95% 55%), blue accent (222 70% 45%) ✅

[2026-07-12 23:00] — ESP32 library update: WSS support, domain production, fix examples
Status: ✅ Selesai
File:
- `esp32-library/src/KuroHub.h` — diubah — tambah parameter useSSL di begin()
- `esp32-library/src/KuroHub.cpp` — diubah — implementasi beginSSL() untuk WSS
- `esp32-library/library.properties` — diubah — v1.1.0, URL domain
- `esp32-library/README.md` — diubah — quick start pakai domain + WSS
- `esp32-library/examples/01_BasicConnect/01_BasicConnect.ino` — diubah — host domain, port 443, WSS
- `esp32-library/examples/02_VirtualPinRead/02_VirtualPinRead.ino` — diubah — sama
- `esp32-library/examples/03_ButtonControl/03_ButtonControl.ino` — diubah — sama
- `esp32-library/examples/04_SliderControl/04_SliderControl.ino` — diubah — sama
- `esp32-library/examples/05_ToggleRelay/05_ToggleRelay.ino` — diubah — sama + hapus dead code onKuroHubConnect()
- `esp32-library/examples/06_MultiSensor/06_MultiSensor.ino` — diubah — sama
- `esp32-library/examples/07_SyncOnConnect/07_SyncOnConnect.ino` — diubah — sama
- `esp32-library/examples/python_dummy/esp32_simulator.py` — diubah — domain + WSS
- `esp32-library/examples/python_dummy/quick_test.py` — diubah — domain + WSS
- `esp32-library/examples/python_dummy/kurohub/client.py` — diubah — docstring URL
- `esp32-library/python/kurohub/client.py` — diubah — docstring URL
- `esp32-library/examples/platformio.ini` — dibuat — config PlatformIO dengan lib_deps
- `esp32-library/README.md` — diubah — tambah instruksi PlatformIO + info library WebSocketsClient.h
- `esp32-library/src/KuroHub.h` — diubah — tambah #include WiFiClientSecure.h + _sslClient member
- `esp32-library/src/KuroHub.cpp` — diubah — pakai beginSSL() untuk WSS, fallback begin() untuk WS
- `esp32-library/src/KuroHub.h` — diubah — tambah GTS Root R4 CA cert (PROGMEM), hapus WEBSOCKETS_SSL_ENABLE
- `esp32-library/src/KuroHub.cpp` — diubah — ganti ke beginSslWithCA() dengan GTS_ROOT_R4
- `nginx/nginx.conf` — diubah — backend_ws port 3001 → 3000 (WebSocket satu server dengan Express)
