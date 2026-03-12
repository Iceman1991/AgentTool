import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { GolarionDate, GolarionMonth } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function generateKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function uid(): string {
  return crypto.randomUUID();
}

export const MONTH_ORDER: Record<GolarionMonth, number> = {
  Abadius: 0,
  Calistril: 1,
  Pharast: 2,
  Gozran: 3,
  Desnus: 4,
  Sarenith: 5,
  Erastus: 6,
  Arodus: 7,
  Rova: 8,
  Lamashan: 9,
  Neth: 10,
  Kuthona: 11,
};

export function formatGolarionDate(date: GolarionDate): string {
  return `${date.day}. ${date.month} ${date.year} SR`;
}

export function compareGolarionDates(a: GolarionDate, b: GolarionDate): number {
  if (a.year !== b.year) return a.year - b.year;
  const ma = MONTH_ORDER[a.month];
  const mb = MONTH_ORDER[b.month];
  if (ma !== mb) return ma - mb;
  return a.day - b.day;
}

export const COLOR_PALETTE = [
  '#7C3AED', '#0891B2', '#DC2626', '#D97706',
  '#059669', '#DB2777', '#2563EB', '#65A30D',
  '#EA580C', '#7C2D12', '#0F766E', '#6D28D9',
];

export function getNextColor(usedColors: string[]): string {
  for (const color of COLOR_PALETTE) {
    if (!usedColors.includes(color)) return color;
  }
  return COLOR_PALETTE[usedColors.length % COLOR_PALETTE.length];
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
