import { apiRequest } from './client';

export function searchWastes(token, params) {
  return apiRequest('/api/wastes', { token, params });
}

export function getWaste(token, wasteId) {
  return apiRequest(`/api/wastes/${wasteId}`, { token });
}

export function getWasteTypes(token) {
  return apiRequest('/api/wastes/types', { token });
}

export function createWaste(token, body) {
  return apiRequest('/api/wastes', { method: 'POST', token, body });
}

export function updateWaste(token, wasteId, body) {
  return apiRequest(`/api/wastes/${wasteId}`, { method: 'PUT', token, body });
}

export function deleteWaste(token, wasteId) {
  return apiRequest(`/api/wastes/${wasteId}`, { method: 'DELETE', token });
}
