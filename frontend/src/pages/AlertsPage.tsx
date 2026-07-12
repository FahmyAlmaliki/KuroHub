import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Bell,
  BellOff,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAlerts } from '../hooks/useAlerts';
import { useDevices } from '../hooks/useDevices';
import { usePins } from '../hooks/useVirtualPin';
import type { AlertRule, AlertHistory } from '../types';

interface AlertFormData {
  name: string;
  deviceId: string;
  pinNumber: number;
  operator: string;
  threshold: number;
  isActive: boolean;
}

const OPERATORS = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
];

const emptyForm: AlertFormData = {
  name: '',
  deviceId: '',
  pinNumber: 0,
  operator: '>',
  threshold: 0,
  isActive: true,
};

export function AlertsPage() {
  const { data: alerts, history, isLoading, createAlert, updateAlert, deleteAlert, toggleAlert } = useAlerts();
  const { data: devices } = useDevices();
  const [selectedDeviceForPins, setSelectedDeviceForPins] = useState('');
  const { data: pins } = usePins(selectedDeviceForPins);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AlertFormData>(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedDeviceForPins('');
    setShowModal(true);
  };

  const openEdit = (alert: AlertRule) => {
    setEditingId(alert.id);
    setForm({
      name: alert.name,
      deviceId: alert.deviceId,
      pinNumber: alert.pinNumber,
      operator: alert.operator,
      threshold: alert.threshold,
      isActive: alert.isActive,
    });
    setSelectedDeviceForPins(alert.deviceId);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAlert({
          id: editingId,
          data: {
            name: form.name,
            operator: form.operator,
            threshold: form.threshold,
          },
        });
        toast.success('Alert updated');
      } else {
        await createAlert(form);
        toast.success('Alert created');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save alert');
    }
  };

  const handleToggleActive = async (alert: AlertRule) => {
    try {
      await toggleAlert(alert.id);
    } catch {
      toast.error('Failed to toggle alert');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      toast.success('Alert deleted');
    } catch {
      toast.error('Failed to delete alert');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage alert rules and view trigger history
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Alert
        </button>
      </div>

      {/* Alert Rules Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !alerts || alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/50 py-20">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Bell className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">No alert rules</h3>
          <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-sm">
            Create alert rules to get notified when pin values cross thresholds.
          </p>
          <button
            onClick={openCreate}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Alert
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Device</th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Pin</th>
                <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Condition</th>
                <th className="px-5 py-3.5 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4 font-medium">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-amber-500/10 p-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      </div>
                      {alert.name}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {devices?.find((d) => d.id === alert.deviceId)?.name ?? alert.deviceId}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs rounded-md bg-accent/10 px-2 py-1 text-accent">
                      V{alert.pinNumber}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs rounded-md bg-muted px-2 py-1">
                      {alert.operator} {alert.threshold}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(alert)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        alert.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border border-border/50'
                      }`}
                    >
                      {alert.isActive ? (
                        <><Bell className="h-3 w-3" /> Active</>
                      ) : (
                        <><BellOff className="h-3 w-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(alert)}
                        className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="rounded-lg p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alert History */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="rounded-lg bg-muted p-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Alert History</h2>
        </div>
        {!history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/50 py-16">
            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No alerts triggered yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Device</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Pin</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Value</th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry: AlertHistory) => (
                  <tr key={entry.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {format(new Date(entry.triggeredAt), 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {devices?.find((d) => d.id === entry.deviceId)?.name ?? entry.deviceId}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs rounded-md bg-accent/10 px-2 py-1 text-accent">V{entry.pinNumber}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">{entry.value}</td>
                    <td className="px-5 py-3.5 text-xs">{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold">
                  {editingId ? 'Edit Alert' : 'Add Alert'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Alert Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="High temperature"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Device</label>
                <select
                  required
                  value={form.deviceId}
                  onChange={(e) => {
                    setForm({ ...form, deviceId: e.target.value, pinNumber: 0 });
                    setSelectedDeviceForPins(e.target.value);
                  }}
                  disabled={!!editingId}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all disabled:opacity-50"
                >
                  <option value="">Select device</option>
                  {devices?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Virtual Pin</label>
                <select
                  required
                  value={form.pinNumber}
                  onChange={(e) => setForm({ ...form, pinNumber: Number(e.target.value) })}
                  disabled={!!editingId || !selectedDeviceForPins}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all disabled:opacity-50"
                >
                  <option value={0}>Select pin</option>
                  {pins?.map((p) => (
                    <option key={p.pinNumber} value={p.pinNumber}>
                      V{p.pinNumber} — {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Condition</label>
                  <select
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Threshold</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-all"
              >
                {editingId ? 'Update Alert' : 'Create Alert'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
