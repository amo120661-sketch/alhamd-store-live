import './config/env.ts';

const DEFAULT_ADMIN_EMAILS = [
  'amn2asayed@gmail.com',
  'admin@alhamd.store',
  'admin@alhamd.local',
];

const configured = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const ADMIN_EMAILS = new Set([
  ...DEFAULT_ADMIN_EMAILS,
  ...configured,
]);

export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && ADMIN_EMAILS.has(email.trim().toLowerCase()));
}
