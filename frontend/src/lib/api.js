import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Remove the token interceptor since we no longer use JWT authentication
// Notes are now identified by wallet address instead

export default api;