import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { getMe, updateMe, changePassword } from '../services/auth.service';
import { Loader2, Save, Key, User, Globe, Palette, Shield } from 'lucide-react';

const TIMEZONES = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Jakarta',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await getMe();
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load profile');
      return res.data;
    },
  });

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [theme, setTheme] = useState('system');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setTimezone(userData.timezone);
      setTheme(userData.theme);
    }
  }, [userData]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await updateMe({ name, timezone, theme });
      if (!res.success) throw new Error(res.error?.message);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await changePassword({ currentPassword, newPassword });
      if (!res.success) throw new Error(res.error?.message);
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password changed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    passwordMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="rounded-lg bg-accent/10 p-1.5">
            <User className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-5 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="settings-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="settings-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              readOnly
              value={userData?.email ?? ''}
              className="flex h-10 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-tz" className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Timezone
            </label>
            <select
              id="settings-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              {TIMEZONES.map((tz: string) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              Theme
            </label>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    theme === t.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-input hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-50 shadow-sm"
          >
            {profileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </form>
      </section>

      {/* Password Section */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="rounded-lg bg-amber-500/10 p-1.5">
            <Shield className="h-4 w-4 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-5 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="settings-current-pw" className="text-sm font-medium">
              Current Password
            </label>
            <input
              id="settings-current-pw"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-new-pw" className="text-sm font-medium">
              New Password
            </label>
            <input
              id="settings-new-pw"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-confirm-pw" className="text-sm font-medium">
              Confirm New Password
            </label>
            <input
              id="settings-confirm-pw"
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 text-sm font-medium text-white hover:bg-amber-700 transition-all disabled:opacity-50 shadow-sm"
          >
            {passwordMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            Change Password
          </button>
        </form>
      </section>
    </div>
  );
}
