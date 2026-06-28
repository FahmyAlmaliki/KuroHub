import { Outlet } from 'react-router-dom';
import { Grip } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Grip className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">KuroHub</h1>
          <p className="text-sm text-muted-foreground">IoT Dashboard Platform</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
