import axios from 'axios';

const BASE = '/api/auth';

export const login = (username, password) =>
  axios.post(`${BASE}/login`, { username, password }).then(r => r.data);

export const register = (data) =>
  axios.post(`${BASE}/register`, data).then(r => r.data);

