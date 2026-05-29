export const PLANS_URL = 'https://drive.internxt.com/?preferences=open&section=account&subsection=plans';
const GB = 1024 ** 3;

export const upgradePlans = [
  { name: 'Essential', maxFileSize: 10 * GB },
  { name: 'Premium', maxFileSize: 50 * GB },
  { name: 'Ultimate', maxFileSize: 100 * GB },
] as const;
