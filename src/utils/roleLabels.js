export const ROLE_OPTIONS = [
  { value: 'SYSTEM_ADMIN', label: '시스템 관리자' },
  { value: 'USER_MANAGER', label: '사용자관리자' },
  { value: 'LAB_MANAGER', label: '연구실 책임자' },
  { value: 'SAFETY_MANAGEMENT_TEAM', label: '안전관리팀' },
  { value: 'SAFETY_MANAGEMENT_TEAM', label: '안전관리팀(점검)' },
  { value: 'LAB_SAFETY_MANAGER', label: '연구실 안전관리 담당자' },
  { value: 'EDUCATION_MANAGER', label: '교육 담당자' },
  { value: 'AUTHORITY_MANAGER', label: '권한관리자' },
  { value: 'RESEARCHER', label: '연구원' },
];

const ROLE_LABEL_MAP = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

export function getRoleLabel(role) {
  return ROLE_LABEL_MAP[role] || role;
}
