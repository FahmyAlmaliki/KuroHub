import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as widgetsService from '../services/widgets.service';
import type { CreateWidgetData, UpdateWidgetData, LayoutItem } from '../services/widgets.service';
import { toast } from 'sonner';

import type { Widget } from '../types';

function mapWidget(raw: Record<string, unknown>): Widget {
  return {
    id: raw.id as string,
    deviceId: raw.deviceId as string,
    type: raw.type as Widget['type'],
    pinNumber: (raw.pinNumber ?? raw.pin_number) as number,
    label: (raw.label as string) ?? '',
    config: (raw.config as Record<string, unknown>) ?? {},
    layout: {
      x: (raw.gridX ?? raw.grid_x ?? 0) as number,
      y: (raw.gridY ?? raw.grid_y ?? 0) as number,
      w: (raw.gridW ?? raw.grid_w ?? 3) as number,
      h: (raw.gridH ?? raw.grid_h ?? 2) as number,
    },
    createdAt: (raw.createdAt ?? raw.created_at) as string,
  };
}

export function useWidgets(deviceId: string) {
  return useQuery({
    queryKey: ['widgets', deviceId],
    queryFn: () => widgetsService.getWidgets(deviceId),
    select: (res) => (res.data?.widgets ?? []).map((w) => mapWidget(w as unknown as Record<string, unknown>)),
    enabled: !!deviceId,
  });
}

export function useCreateWidget(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWidgetData) => widgetsService.createWidget(deviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', deviceId] });
      toast.success('Widget added');
    },
    onError: () => toast.error('Failed to create widget'),
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, widgetId, data }: { deviceId: string; widgetId: string; data: UpdateWidgetData }) =>
      widgetsService.updateWidget(deviceId, widgetId, data),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['widgets', deviceId] });
      toast.success('Widget updated');
    },
    onError: () => toast.error('Failed to update widget'),
  });
}

export function useDeleteWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, widgetId }: { deviceId: string; widgetId: string }) =>
      widgetsService.deleteWidget(deviceId, widgetId),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['widgets', deviceId] });
      toast.success('Widget deleted');
    },
    onError: () => toast.error('Failed to delete widget'),
  });
}

export function useSaveLayout(deviceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (layouts: LayoutItem[]) => widgetsService.saveLayout(deviceId, layouts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', deviceId] });
    },
    onError: () => toast.error('Failed to save layout'),
  });
}
