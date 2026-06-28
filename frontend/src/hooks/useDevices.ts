import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as devicesService from '../services/devices.service';
import type { CreateDeviceData, UpdateDeviceData } from '../services/devices.service';
import { toast } from 'sonner';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: devicesService.getDevices,
    select: (res) => res.data?.devices ?? [],
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => devicesService.getDevice(id),
    select: (res) => res.data?.device,
    enabled: !!id,
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDeviceData) => devicesService.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onError: () => toast.error('Failed to create device'),
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateDeviceData) =>
      devicesService.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated');
    },
    onError: () => toast.error('Failed to update device'),
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted');
    },
    onError: () => toast.error('Failed to delete device'),
  });
}

export function useRegenerateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesService.regenerateApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('API key regenerated');
    },
    onError: () => toast.error('Failed to regenerate API key'),
  });
}
