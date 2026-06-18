import { apiRequest } from './client';

export function getEducations(token) {
  return apiRequest('/api/educations', { token });
}

export function getEducation(token, contentId) {
  return apiRequest(`/api/educations/${contentId}`, { token });
}

export function getEducationForm(token) {
  return apiRequest('/api/educations/form', { token });
}

export function registerEducation(token, body) {
  return apiRequest('/api/educations', { method: 'POST', token, body });
}

export function updateEducationProgress(token, contentId, lastViewedPoint) {
  return apiRequest(`/api/educations/${contentId}/progress`, {
    method: 'POST',
    token,
    params: { lastViewedPoint: Math.floor(lastViewedPoint) },
  });
}
