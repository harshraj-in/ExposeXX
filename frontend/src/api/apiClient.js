import axios from 'axios';
import useStore from '../store/useStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // We cannot directly use hooks here, get state from store
    const user = useStore.getState().user;
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
