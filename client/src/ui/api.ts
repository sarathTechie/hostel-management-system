
import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const apiBaseUrl = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : import.meta.env.DEV
    ? '/api/v1'
    : undefined;

if (!apiBaseUrl) {
  throw new Error(
    'VITE_API_URL must be set to the deployed API base URL for production builds.'
  );
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const endpoint = String(error.config?.url ?? '');

    if (
      error.response?.status === 401 &&
      !endpoint.endsWith('/auth/login') &&
      !endpoint.endsWith('/auth/logout')
    ) {
      window.dispatchEvent(new Event('hms:unauthorized'));
    }

    return Promise.reject(error);
  }
);
