export const PLAN_VALUES = ['dirt', 'iron', 'diamond', 'netherite'];
export const ROLE_VALUES = ['member', 'customer', 'admin'];

export function normalizePlan(value) {
  const plan = String(value || '').trim().toLowerCase();
  return PLAN_VALUES.includes(plan) ? plan : 'dirt';
}

export function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  return ROLE_VALUES.includes(role) ? role : 'member';
}
