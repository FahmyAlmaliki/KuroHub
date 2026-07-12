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
  Search,
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredDevices = searchQuery
    ? (devices ?? []).filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.groupName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : devices;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage your ESP32 devices
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Device
        </button>
      </div>

      {devices && devices.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices by name, location, or group..."
            className="flex h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium mb-1">
            <Cpu className="h-4 w-4" />
            Failed to load devices
          </div>
          <p className="text-destructive/80">{(error as Error)?.message ?? 'Unknown error'}</p>
        </div>
      ) : !filteredDevices || filteredDevices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-card/50 py-20">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Cpu className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">No devices {searchQuery ? 'found' : 'yet'}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-sm">
            {searchQuery
              ? 'Try a different search term.'
              : 'Add your first ESP32 device to start monitoring.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Device
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <button
              key={device.id}
              onClick={() => navigate(`/devices/${device.id}`)}
              className="group rounded-xl border border-border/50 bg-card p-5 text-left shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 p-2.5 group-hover:from-accent/30 group-hover:to-accent/10 transition-colors">
                    <Cpu className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-accent transition-colors">
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
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

              <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                  <Hash className="h-3 w-3" />
                  {device.pinCount} pins
                </span>
                <span className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                  <LayoutGrid className="h-3 w-3" />
                  {device.widgetCount} widgets
                </span>
                {device.lastSeen && (
                  <span className="flex items-center gap-1.5 ml-auto">
                    <Eye className="h-3 w-3" />
                    {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* API Key Modal */}
      {apiKeyToShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Device Created</h2>
              </div>
              <button
                onClick={() => setApiKeyToShow(null)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Copy the API key below. You'll need it to connect your ESP32.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-muted/50 px-4 py-3">
              <code className="flex-1 text-sm font-mono break-all select-all text-primary">{apiKeyToShow}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiKeyToShow);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="rounded-lg p-2 hover:bg-muted transition-colors shrink-0"
                title="Copy API key"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                ⚠ Save this key — it won't be shown again!
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You can regenerate the key later from the device settings page if needed.
              </p>
            </div>
            <button
              onClick={() => setApiKeyToShow(null)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Cpu className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold">Add Device</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="dev-name" className="text-sm font-medium">Device Name</label>
                <input
                  id="dev-name"
                  required
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="Living Room Sensor"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="dev-location" className="text-sm font-medium">Location</label>
                <input
                  id="dev-location"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="Living Room"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="dev-desc" className="text-sm font-medium">Description</label>
                <textarea
                  id="dev-desc"
                  value={newDevice.description}
                  onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })}
                  className="flex min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-50"
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
