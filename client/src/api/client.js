import axios from 'axios';

const API_BASE_URL = 'http://localhost:7891/api';

const createApiClient = (getToken) => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Unauthorized - token may have expired');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export default createApiClient;
