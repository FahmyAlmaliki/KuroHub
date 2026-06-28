import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export function useAuth() {
  const { user, isAuthenticated, setUser, setTokens, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: authService.LoginData) => authService.login(data),
    onSuccess: (res) => {
      if (!res.data) return;
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      toast.success('Login berhasil');
      navigate('/');
    },
    onError: () => toast.error('Email atau password salah'),
  });

  const registerMutation = useMutation({
    mutationFn: (data: authService.RegisterData) => authService.register(data),
    onSuccess: (res) => {
      if (!res.data) return;
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      toast.success('Akun berhasil dibuat');
      navigate('/');
    },
    onError: () => toast.error('Registrasi gagal'),
  });

  const logout = () => {
    authService.logout().catch(() => {});
    storeLogout();
    queryClient.clear();
    navigate('/login');
  };

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
  });

  return {
    user: profile?.data ?? user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutateAsync,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
  };
}
