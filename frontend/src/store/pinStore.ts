import { create } from 'zustand';

interface PinState {
  pins: Record<string, Record<number, string>>;
  deviceStatuses: Record<string, 'online' | 'offline'>;
  setPinValue: (deviceId: string, pin: number, value: string) => void;
  setDeviceStatus: (deviceId: string, status: 'online' | 'offline') => void;
}

export const usePinStore = create<PinState>((set) => ({
  pins: {},
  deviceStatuses: {},
  setPinValue: (deviceId, pin, value) =>
    set((state) => ({
      pins: {
        ...state.pins,
        [deviceId]: { ...state.pins[deviceId], [pin]: value },
      },
    })),
  setDeviceStatus: (deviceId, status) =>
    set((state) => ({
      deviceStatuses: { ...state.deviceStatuses, [deviceId]: status },
    })),
}));
