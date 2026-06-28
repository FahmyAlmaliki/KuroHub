import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevices, useCreateDevice } from '../hooks/useDevices';
import {
  Plus,
  Cpu,
  Wifi,
  WifiOff,
  MapPin,
  Hash,
  LayoutGrid,
  Eye,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CreateDeviceData } from '../services/devices.service';

export function DevicesPage() {
  const navigate = useNavigate();
  const { data: devices, isLoading, isError, error } = useDevices();
  const { mutateAsync: createDevice, isPending: isCreating } = useCreateDevice();
  const [showAddModal, setShowAddModal] = useState(false);
  const [apiKeyToShow, setApiKeyToShow] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [newDevice, setNewDevice] = useState<CreateDeviceData>({
    name: '',
    description: '',
    location: '',
    groupName: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createDevice(newDevice);
      const apiKey = res.data?.apiKey;
      if (apiKey) {
        setApiKeyToShow(apiKey);
      }
      setShowAddModal(false);
      setNewDevice({ name: '', description: '', location: '', groupName: '' });
    } catch {
      // Error handled by mutation's onError
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your ESP32 devices
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Device
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load devices: {(error as Error)?.message ?? 'Unknown error'}
        </div>
      ) : !devices || devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-16">
          <Cpu className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No devices yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first ESP32 device to get started.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Device
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <button
              key={device.id}
              onClick={() => navigate(`/devices/${device.id}`)}
              className="group rounded-xl border bg-card p-5 text-left shadow-sm transition hover:shadow-md hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {device.name}
                    </h3>
                    {device.location && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {device.location}
                      </p>
                    )}
                  </div>
                </div>
                {device.status === 'online' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Wifi className="h-3 w-3" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {device.pinCount} pins
                </span>
                <span className="flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" />
                  {device.widgetCount} widgets
                </span>
                {device.lastSeen && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {apiKeyToShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Device Created</h2>
              <button
                onClick={() => setApiKeyToShow(null)}
                className="rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Copy the API key below. You'll need it to connect your ESP32.
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2.5">
              <code className="flex-1 text-sm font-mono break-all select-all">{apiKeyToShow}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiKeyToShow);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors shrink-0"
                title="Copy API key"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="text-base">⚠</span> Save this key — it won't be shown again!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can regenerate the key later from the device settings page if needed.
            </p>
            <button
              onClick={() => setApiKeyToShow(null)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Device</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="dev-name" className="text-sm font-medium">Device Name</label>
                <input
                  id="dev-name"
                  required
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Living Room Sensor"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dev-location" className="text-sm font-medium">Location</label>
                <input
                  id="dev-location"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Living Room"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dev-desc" className="text-sm font-medium">Description</label>
                <textarea
                  id="dev-desc"
                  value={newDevice.description}
                  onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })}
                  className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCreating ? 'Creating...' : 'Create Device'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
