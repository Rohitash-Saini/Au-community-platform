import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend server base URL
  withCredentials: true, // If using cookies/sessions
});

// Interceptor to add Authorization token if stored
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('au_token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
