import { api } from './api';

export async function login({ email, password }) {
  const response = await api.post('/auth/login', { email, password });
  
  if (response && response.token) {
    localStorage.setItem('@DanceFlow:token', response.token);
    localStorage.setItem('@DanceFlow:user', JSON.stringify(response.user));
    return response;
  }
  
  throw new Error('Resposta de autenticação inválida.');
}

export function logout() {
  localStorage.removeItem('@DanceFlow:token');
  localStorage.removeItem('@DanceFlow:user');
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('@DanceFlow:user');
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (err) {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('@DanceFlow:token');
}
