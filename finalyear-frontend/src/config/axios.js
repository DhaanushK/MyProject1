import axios from 'axios';

// Use the environment-specific API URL
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
console.log('Using API URL:', baseURL);

const instance = axios.create({
  baseURL,
  timeout: 60000, // 60 seconds timeout
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  withCredentials: false, // Disable CORS credentials for now
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Retry configuration
  retry: 3,
  retryDelay: (retryCount) => {
    return retryCount * 2000; // Time interval between retries
  }
});

// Add a request interceptor to handle headers and authentication
instance.interceptors.request.use(
  (config) => {
    // Initialize headers if not present
    config.headers = config.headers || {};

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token to check its contents (just for logging)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        console.log('Token payload in request:', payload);
        
        if (!payload.email) {
          console.warn('Token missing email field:', payload);
          // Force re-login if token is invalid
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(new Error('Invalid token: missing email'));
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the request configuration
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? '[REDACTED]' : undefined
      }
    });

    // Ensure content type and other headers are set
    config.headers['Content-Type'] = 'application/json';
    config.headers['Accept'] = 'application/json';
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
instance.interceptors.response.use(
  (response) => {
    // Successful response handling
    return response;
  },
  (error) => {
    // Error handling
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });

    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response Error:', error.response.status, error.response.data);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;