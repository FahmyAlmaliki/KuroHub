import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as alertService from '../services/alert.service';
import type { CreateAlertData, UpdateAlertData } from '../services/alert.service';
import type { AlertHistory } from '../types';
import { toast } from 'sonner';

export function useAlerts() {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: alertService.getAlerts,
    select: (res) => res.data?.rules ?? [],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAlertData) => alertService.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert created');
    },
    onError: () => toast.error('Failed to create alert'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertData }) =>
      alertService.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert updated');
    },
    onError: () => toast.error('Failed to update alert'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert deleted');
    },
    onError: () => toast.error('Failed to delete alert'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => alertService.toggleAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => toast.error('Failed to toggle alert'),
  });

  return {
    data: alertsQuery.data ?? [],
    alerts: alertsQuery.data ?? [],
    history: [] as AlertHistory[],
    isLoading: alertsQuery.isLoading,
    createAlert: createMutation.mutateAsync,
    updateAlert: updateMutation.mutateAsync,
    deleteAlert: deleteMutation.mutateAsync,
    toggleAlert: toggleMutation.mutateAsync,
  };
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlertData) => alertService.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert created');
    },
    onError: () => toast.error('Failed to create alert'),
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertData }) =>
      alertService.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert updated');
    },
    onError: () => toast.error('Failed to update alert'),
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert deleted');
    },
    onError: () => toast.error('Failed to delete alert'),
  });
}

export function useToggleAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertService.toggleAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => toast.error('Failed to toggle alert'),
  });
}

export function useAlertHistory(ruleId: string) {
  return useQuery({
    queryKey: ['alertHistory', ruleId],
    queryFn: () => alertService.getAlertHistory(ruleId),
    select: (res) => res.data,
    enabled: !!ruleId,
  });
}
