import { apiRequest } from './client';

export function getChemicals(token) {
  return apiRequest('/api/chemicals', { token });
}

export function getChemical(token, chemicalId) {
  return apiRequest(`/api/chemicals/${chemicalId}`, { token });
}

export function registerChemical(token, body) {
  return apiRequest('/api/chemicals', { method: 'POST', token, body });
}
