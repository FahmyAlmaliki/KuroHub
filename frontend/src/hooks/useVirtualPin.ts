import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as pinService from '../services/virtualpin.service';
import type { UpsertPinData, HistoryParams, HistoryResponse } from '../services/virtualpin.service';
import { toast } from 'sonner';

export function usePins(deviceId: string) {
  return useQuery({
    queryKey: ['pins', deviceId],
    queryFn: () => pinService.getPins(deviceId),
    select: (res) => res.data?.pins ?? [],
    enabled: !!deviceId,
  });
}

export function usePinHistory(deviceId: string, pinNumber: number, params?: HistoryParams) {
  return useQuery({
    queryKey: ['pinHistory', deviceId, pinNumber, params],
    queryFn: () => pinService.getHistory(deviceId, pinNumber, params),
    select: (res) => {
      const d = res as { data: unknown };
      return d.data as HistoryResponse;
    },
    enabled: !!deviceId && pinNumber >= 0,
  });
}

export function usePinLatest(deviceId: string, pinNumber: number) {
  return useQuery({
    queryKey: ['pinLatest', deviceId, pinNumber],
    queryFn: () => pinService.getLatest(deviceId, pinNumber),
    select: (res) => res.data,
    enabled: !!deviceId && pinNumber >= 0,
    refetchInterval: 5000,
  });
}

export function useUpsertPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, data }: { deviceId: string; data: UpsertPinData }) =>
      pinService.upsertPin(deviceId, data),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['pins', deviceId] });
      toast.success('Pin configuration saved');
    },
    onError: () => toast.error('Failed to save pin'),
  });
}

export function useDeletePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, pinNumber }: { deviceId: string; pinNumber: number }) =>
      pinService.deletePin(deviceId, pinNumber),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['pins', deviceId] });
      toast.success('Pin deleted');
    },
    onError: () => toast.error('Failed to delete pin'),
  });
}

export function useWritePin() {
  return useMutation({
    mutationFn: ({ deviceId, pinNumber, value }: { deviceId: string; pinNumber: number; value: string }) =>
      pinService.writePin(deviceId, pinNumber, value),
    onError: () => toast.error('Failed to write pin'),
  });
}
