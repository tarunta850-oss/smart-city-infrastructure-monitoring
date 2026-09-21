import axios from 'axios';

let rawBaseUrl = import.meta.env.VITE_API_URL || '';
if (rawBaseUrl && !rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
    rawBaseUrl = `https://${rawBaseUrl}`;
}

export const getApiBaseUrl = () => {
    if (rawBaseUrl) {
        return rawBaseUrl.replace(/\/$/, '');
    }
    // In local dev (port 5173, 3000, 3005, etc.), connect to FastAPI on 8005
    if (typeof window !== 'undefined') {
        const { hostname, port, origin } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            if (port && port !== '8005') {
                return 'http://localhost:8005';
            }
        }
        return origin;
    }
    return 'http://localhost:8005';
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
});

// Always attach the latest token from localStorage on every request
api.interceptors.request.use((config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Auto-logout on 401 — token expired or invalid
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
