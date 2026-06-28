import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePinStore } from '../store/pinStore';
import { toast } from 'sonner';

export function useWebSocket(deviceId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const subscribedDevices = useRef<Set<string>>(new Set());
  const isAuthSent = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const wsUrl = import.meta.env.VITE_WS_URL
    || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/dashboard`;

  function connect(token: string) {
    if (!token) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    isAuthSent.current = false;
    setIsConnected(false);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      isAuthSent.current = true;
      setIsConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'auth_ok':
            subscribedDevices.current.forEach((did) => {
              ws.send(JSON.stringify({ type: 'subscribe', device_id: did }));
            });
            break;
          case 'pin_update':
            usePinStore.getState().setPinValue(msg.device_id, msg.pin, msg.value);
            break;
          case 'device_status':
            usePinStore.getState().setDeviceStatus(msg.device_id, msg.status);
            break;
          case 'alert_triggered':
            toast.warning(`⚠️ ${msg.message}`, { duration: 5000 });
            break;
        }
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setIsConnected(false);
      reconnectTimer.current = setTimeout(() => {
        const token = useAuthStore.getState().accessToken;
        if (token) connect(token);
      }, 3000);
    };

    ws.onerror = () => ws.close();
  }

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    connect(token);
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []); // only run on mount; useAuthStore subscription handles token changes

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      if (state.accessToken && !wsRef.current) {
        connect(state.accessToken);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (deviceId && isConnected) {
      subscribe(deviceId);
    }
  }, [deviceId, isConnected]);

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

  const subscribe = useCallback((deviceId: string) => {
    subscribedDevices.current.add(deviceId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', device_id: deviceId }));
    }
  }, []);

  const unsubscribe = useCallback((deviceId: string) => {
    subscribedDevices.current.delete(deviceId);
  }, []);

  return { sendPinWrite, subscribe, unsubscribe, isConnected };
}
