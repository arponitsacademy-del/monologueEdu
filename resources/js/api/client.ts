import axios from 'axios';

export const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // If on a protected route, redirect to login
            if (window.location.pathname.startsWith('/admin') || 
                window.location.pathname.startsWith('/teacher') || 
                window.location.pathname.startsWith('/student') ||
                window.location.pathname.startsWith('/learning')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export function formatBDT(amount: number): string {
    return '৳' + Number(amount || 0).toLocaleString('en-US');
}

export function formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}
