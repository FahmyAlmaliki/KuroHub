import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore.getState();
      if (auth.refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: auth.refreshToken });
          if (data.success) {
            auth.setAccessToken(data.data.accessToken);
            error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(error.config);
          }
        } catch {
          auth.logout();
        }
      } else {
        auth.logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
