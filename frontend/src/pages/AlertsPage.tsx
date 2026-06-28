import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage alert rules and view trigger history
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-16">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No alert rules</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create alert rules to get notified when pin values cross thresholds.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Alert
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pin</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condition</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {alert.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {devices?.find((d) => d.id === alert.deviceId)?.name ?? alert.deviceId}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">V{alert.pinNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {alert.operator} {alert.threshold}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(alert)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        alert.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {alert.isActive ? (
                        <><Bell className="h-3 w-3" /> Active</>
                      ) : (
                        <><BellOff className="h-3 w-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
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
        <h2 className="text-lg font-semibold mb-4">Alert History</h2>
        {!history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card py-12">
            <Bell className="h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No alerts triggered yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pin</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Message</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry: AlertHistory) => (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(entry.triggeredAt), 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {devices?.find((d) => d.id === entry.deviceId)?.name ?? entry.deviceId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">V{entry.pinNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{entry.value}</td>
                    <td className="px-4 py-3 text-xs">{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Alert' : 'Add Alert'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="High temperature"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Device</label>
                <select
                  required
                  value={form.deviceId}
                  onChange={(e) => {
                    setForm({ ...form, deviceId: e.target.value, pinNumber: 0 });
                    setSelectedDeviceForPins(e.target.value);
                  }}
                  disabled={!!editingId}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">Select device</option>
                  {devices?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Virtual Pin</label>
                <select
                  required
                  value={form.pinNumber}
                  onChange={(e) => setForm({ ...form, pinNumber: Number(e.target.value) })}
                  disabled={!!editingId || !selectedDeviceForPins}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Condition</label>
                  <select
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Threshold</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
